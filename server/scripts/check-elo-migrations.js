#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY/SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const requiredTables = [
  'player_ratings',
  'seasons',
  'seasonal_ratings',
  'ranked_matches',
  'match_rounds',
  'player_performance_stats',
  'match_replays'
];

async function checkTable(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.message.includes('does not exist')) {
        return { exists: false, count: 0 };
      }
      throw error;
    }
    
    return { exists: true, count: count || 0 };
  } catch (error) {
    return { exists: false, count: 0, error: error.message };
  }
}

async function checkEloMigrations() {
  console.log('🔍 Checking ELO Ranking System Database Tables...\n');
  
  let allTablesExist = true;
  const results = [];
  
  for (const table of requiredTables) {
    const result = await checkTable(table);
    results.push({ table, ...result });
    
    if (!result.exists) {
      allTablesExist = false;
      console.log(`❌ ${table}: NOT FOUND`);
    } else {
      console.log(`✅ ${table}: Found (${result.count} rows)`);
    }
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  if (!allTablesExist) {
    console.log('⚠️  Some ELO tables are missing!\n');
    console.log('To fix this issue:\n');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Run the migration file: server/migrations/elo_combined_migration.sql');
    console.log('\nAlternatively, run each individual migration:');
    console.log('  - 008_create_elo_tables.sql');
    console.log('  - 009_match_history_analytics.sql');
    console.log('  - 010_match_replay_system.sql');
  } else {
    console.log('✅ All ELO ranking system tables are present!');
    
    // Check for any tables with data
    const tablesWithData = results.filter(r => r.count > 0);
    if (tablesWithData.length > 0) {
      console.log('\nTables with data:');
      tablesWithData.forEach(t => {
        console.log(`  - ${t.table}: ${t.count} rows`);
      });
    }
  }
  
  // Check for active season
  if (results.find(r => r.table === 'seasons')?.exists) {
    try {
      const { data: activeSeason } = await supabase
        .from('seasons')
        .select('*')
        .eq('is_active', true)
        .single();
      
      if (activeSeason) {
        console.log(`\n📅 Active Season: ${activeSeason.name}`);
        console.log(`   Started: ${new Date(activeSeason.start_date).toLocaleDateString()}`);
        console.log(`   Ends: ${new Date(activeSeason.end_date).toLocaleDateString()}`);
      } else {
        console.log('\n⚠️  No active season found. You may want to create one.');
      }
    } catch (error) {
      // Ignore error if no seasons exist
    }
  }
}

checkEloMigrations().catch(console.error);
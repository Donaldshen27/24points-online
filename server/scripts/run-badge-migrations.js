#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY/SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableExists(tableName) {
  const { data, error } = await supabase.rpc('to_regclass', { tablename: `public.${tableName}` });
  return !error && data !== null;
}

async function runMigrations() {
  console.log('🔍 Checking badge system tables...\n');

  // Check if tables exist
  const tables = ['badge_definitions', 'user_statistics', 'user_badges', 'badge_progress', 'badge_challenges'];
  const missingTables = [];
  
  for (const table of tables) {
    const exists = await checkTableExists(table);
    if (exists) {
      console.log(`✅ Table ${table} exists`);
    } else {
      console.log(`❌ Table ${table} is missing`);
      missingTables.push(table);
    }
  }

  if (missingTables.length > 0) {
    console.log('\n⚠️  Missing tables detected. Please run the following migrations in order:');
    console.log('1. 002_badge_system.sql - Creates the badge system tables');
    console.log('2. 003_badge_definitions_seed.sql - Seeds badge definitions');
    console.log('3. 004_badge_system_guest_support.sql - Adds guest user support');
    console.log('4. 005_badge_leaderboard_function.sql - Adds leaderboard functions');
    
    console.log('\nYou can run these migrations in the Supabase SQL editor.');
    console.log('Migration files are located in: server/migrations/');
  } else {
    console.log('\n✅ All badge tables exist!');
    
    // Check badge count
    const { count: badgeCount } = await supabase
      .from('badge_definitions')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 Badge definitions: ${badgeCount || 0}`);
    
    if (!badgeCount || badgeCount === 0) {
      console.log('⚠️  No badge definitions found. Run 003_badge_definitions_seed.sql');
    }
    
    // Check user badges
    const { count: userBadgeCount } = await supabase
      .from('user_badges')
      .select('*', { count: 'exact', head: true });
    
    console.log(`👤 User badges earned: ${userBadgeCount || 0}`);
    
    // Check recent badges
    const { data: recentBadges } = await supabase
      .from('user_badges')
      .select('user_id, badge_id, earned_at')
      .order('earned_at', { ascending: false })
      .limit(5);
    
    if (recentBadges && recentBadges.length > 0) {
      console.log('\n🏆 Recent badge awards:');
      recentBadges.forEach(badge => {
        console.log(`- User ${badge.user_id} earned ${badge.badge_id} at ${badge.earned_at}`);
      });
    }
  }
}

runMigrations().catch(console.error);
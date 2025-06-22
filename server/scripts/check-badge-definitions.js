#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBadgeDefinitions() {
  console.log('🔍 Checking badge_definitions table...\n');
  
  // Count badges
  const { count, error: countError } = await supabase
    .from('badge_definitions')
    .select('*', { count: 'exact', head: true });
    
  if (countError) {
    console.error('Error counting badges:', countError);
    return;
  }
  
  console.log(`Total badge definitions: ${count || 0}`);
  
  if (!count || count === 0) {
    console.log('\n❌ No badge definitions found!');
    console.log('You need to run the seed migration: 003_badge_definitions_seed.sql');
    console.log('\nGo to Supabase SQL editor and run that migration.');
    return;
  }
  
  // Get some sample badges
  const { data: badges, error } = await supabase
    .from('badge_definitions')
    .select('id, name, category, is_active')
    .limit(10);
    
  if (error) {
    console.error('Error fetching badges:', error);
  } else {
    console.log('\nSample badges:');
    badges.forEach(badge => {
      console.log(`- ${badge.id}: ${badge.name} (${badge.category}) ${badge.is_active ? '✅' : '❌'}`);
    });
  }
  
  // Check for specific badges used in the code
  const requiredBadges = ['first_win', 'speed_demon_bronze', 'winning_streak_bronze'];
  console.log('\n🔍 Checking required badges:');
  
  for (const badgeId of requiredBadges) {
    const { data, error } = await supabase
      .from('badge_definitions')
      .select('id')
      .eq('id', badgeId)
      .single();
      
    if (error || !data) {
      console.log(`❌ Missing: ${badgeId}`);
    } else {
      console.log(`✅ Found: ${badgeId}`);
    }
  }
}

checkBadgeDefinitions().catch(console.error);
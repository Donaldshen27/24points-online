#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY/SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('🔧 Testing badge system with Supabase...\n');
console.log('Using URL:', supabaseUrl);
console.log('Using key type:', process.env.SUPABASE_SERVICE_KEY ? 'SERVICE_KEY' : 'ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBadgeSystem() {
  console.log('\n1️⃣ Testing direct table access...');
  
  // Test 1: Check if we can read from badge_definitions
  console.log('\n📖 Reading badge_definitions table:');
  const { data: badges, error: badgeError } = await supabase
    .from('badge_definitions')
    .select('id, name, category')
    .limit(5);
    
  if (badgeError) {
    console.error('❌ Error reading badge_definitions:', badgeError);
  } else {
    console.log('✅ Successfully read badge_definitions:', badges?.length || 0, 'badges found');
    if (badges && badges.length > 0) {
      console.log('Sample badges:', badges.slice(0, 3).map(b => b.id));
    }
  }
  
  // Test 2: Check if we can read from user_badges
  console.log('\n📖 Reading user_badges table:');
  const { data: userBadges, error: userBadgeError } = await supabase
    .from('user_badges')
    .select('*')
    .limit(5);
    
  if (userBadgeError) {
    console.error('❌ Error reading user_badges:', userBadgeError);
  } else {
    console.log('✅ Successfully read user_badges:', userBadges?.length || 0, 'badges found');
  }
  
  // Test 3: Try to insert a test badge
  console.log('\n2️⃣ Testing badge insertion...');
  
  const testUserId = 'test-user-' + Date.now();
  const testBadgeId = 'first_win'; // This should exist from seed data
  
  console.log(`\n🎯 Attempting to award badge '${testBadgeId}' to user '${testUserId}'`);
  
  const { data: insertData, error: insertError } = await supabase
    .from('user_badges')
    .insert({
      user_id: testUserId,
      badge_id: testBadgeId,
      earned_at: new Date().toISOString()
    })
    .select();
    
  if (insertError) {
    console.error('❌ Error inserting badge:', insertError);
    console.error('Error details:', {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint
    });
    
    // Check if it's a foreign key error
    if (insertError.code === '23503') {
      console.log('\n⚠️  Foreign key constraint error - this might mean:');
      console.log('- The badge_id does not exist in badge_definitions');
      console.log('- There\'s a constraint on user_id that requires it to exist in another table');
    }
  } else {
    console.log('✅ Successfully inserted test badge:', insertData);
    
    // Clean up
    console.log('\n🧹 Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('user_badges')
      .delete()
      .eq('user_id', testUserId);
      
    if (deleteError) {
      console.error('Warning: Could not clean up test data:', deleteError);
    } else {
      console.log('✅ Test data cleaned up');
    }
  }
  
  // Test 4: Check RLS status
  console.log('\n3️⃣ Checking RLS (Row Level Security) status...');
  
  // This query checks if RLS is enabled on our tables
  const { data: rlsData, error: rlsError } = await supabase
    .rpc('pg_catalog.pg_tables')
    .select('tablename, rowsecurity')
    .in('tablename', ['badge_definitions', 'user_badges', 'user_statistics', 'puzzles'])
    .eq('schemaname', 'public');
    
  if (!rlsError && rlsData) {
    console.log('RLS status:', rlsData);
  }
  
  // Test 5: Check if using service key vs anon key makes a difference
  if (process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_KEY) {
    console.log('\n4️⃣ Testing with different key types...');
    
    const anonClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY);
    const serviceClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY);
    
    const { error: anonError } = await anonClient
      .from('user_badges')
      .select('count');
      
    const { error: serviceError } = await serviceClient
      .from('user_badges')
      .select('count');
      
    console.log('Anon key access:', anonError ? '❌ Failed' : '✅ Success');
    console.log('Service key access:', serviceError ? '❌ Failed' : '✅ Success');
    
    if (anonError && !serviceError) {
      console.log('\n⚠️  RLS is blocking anon key access. You may need to:');
      console.log('1. Use service key for badge operations, OR');
      console.log('2. Create RLS policies to allow badge operations');
    }
  }
}

testBadgeSystem().catch(console.error);
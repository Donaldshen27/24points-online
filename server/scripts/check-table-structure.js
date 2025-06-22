#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableStructure() {
  console.log('🔍 Checking user_badges table structure...\n');
  
  // Get a sample row to see the actual columns
  const { data, error } = await supabase
    .from('user_badges')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error:', error);
  } else if (data && data.length === 0) {
    // Table is empty, try to insert without earned_at to see what columns exist
    console.log('Table is empty. Attempting insert to discover columns...');
    
    const { data: insertData, error: insertError } = await supabase
      .from('user_badges')
      .insert({
        user_id: 'test',
        badge_id: 'test'
      })
      .select();
      
    if (insertError) {
      console.log('Insert error (expected):', insertError.message);
      
      // Try different column names
      console.log('\nTrying with unlocked_at instead of earned_at...');
      const { data: data2, error: error2 } = await supabase
        .from('user_badges')
        .insert({
          user_id: 'test',
          badge_id: 'test',
          unlocked_at: new Date().toISOString()
        })
        .select();
        
      if (error2) {
        console.log('Error with unlocked_at:', error2.message);
      } else {
        console.log('Success with unlocked_at!', data2);
      }
    }
  } else {
    console.log('Sample row:', data[0]);
    console.log('\nColumns found:', Object.keys(data[0]));
  }
}

checkTableStructure().catch(console.error);
#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

async function testDirectAPI() {
  console.log('🔍 Testing direct Supabase REST API...\n');
  
  const apiUrl = `${supabaseUrl}/rest/v1/user_badges`;
  
  // First, try to get the OpenAPI spec to see column definitions
  try {
    console.log('📋 Fetching table schema...');
    const schemaResponse = await axios.get(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    // Find user_badges definition
    const paths = schemaResponse.data.paths;
    if (paths && paths['/user_badges']) {
      console.log('user_badges schema:', JSON.stringify(paths['/user_badges'].post?.requestBody?.content?.['application/json']?.schema, null, 2));
    }
  } catch (error) {
    console.log('Could not fetch schema:', error.message);
  }
  
  // Try a direct insert
  console.log('\n🎯 Attempting direct API insert...');
  
  const testData = {
    user_id: 'test-user-' + Date.now(),
    badge_id: 'first_win',
    earned_at: new Date().toISOString()
  };
  
  try {
    const response = await axios.post(apiUrl, testData, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.data?.message) {
      console.log('\nError message:', error.response.data.message);
      
      // If it's a schema cache error, try without earned_at
      if (error.response.data.message.includes('earned_at')) {
        console.log('\n🔄 Retrying without earned_at field...');
        
        delete testData.earned_at;
        
        try {
          const response2 = await axios.post(apiUrl, testData, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });
          
          console.log('✅ Success without earned_at:', response2.data);
          console.log('\n⚠️  The earned_at column might not exist or might have a default value');
        } catch (error2) {
          console.error('❌ Still failed:', error2.response?.data || error2.message);
        }
      }
    }
  }
}

testDirectAPI().catch(console.error);
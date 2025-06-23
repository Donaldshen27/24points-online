#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running ELO system fix migration...');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', '015_fix_elo_schema_issues.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing migration SQL...');
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('exec_sql RPC not available, trying alternative approach...');
      
      // Split the migration into individual statements
      const statements = migrationSQL
        .split(/;\s*$/m)
        .filter(stmt => stmt.trim().length > 0)
        .map(stmt => stmt.trim() + ';');
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        // Skip certain statements that might not work through Supabase client
        if (statement.includes('DROP FUNCTION') || 
            statement.includes('CREATE FUNCTION') || 
            statement.includes('CREATE OR REPLACE FUNCTION') ||
            statement.includes('DO $$')) {
          console.log(`Statement ${i + 1}: Requires direct database access, skipping...`);
          continue;
        }
        
        console.log(`Executing statement ${i + 1} of ${statements.length}...`);
        
        // For ALTER TABLE statements, we can try using raw SQL
        if (statement.includes('ALTER TABLE')) {
          console.log('ALTER TABLE statement detected, may need manual execution');
        }
      }
      
      console.error('\nIMPORTANT: This migration contains functions and complex SQL that cannot be executed through the Supabase client.');
      console.error('Please run the migration directly in the Supabase SQL Editor:');
      console.error('1. Go to your Supabase dashboard');
      console.error('2. Navigate to SQL Editor');
      console.error('3. Copy and paste the contents of migrations/015_fix_elo_schema_issues.sql');
      console.error('4. Execute the migration');
      
      return;
    }
    
    console.log('Migration completed successfully!');
    
    // Test the changes
    console.log('\nTesting the changes...');
    
    // Check if columns exist
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'ranked_matches' });
    
    if (!columnsError && columns) {
      console.log('Ranked matches columns:', columns.map(c => c.column_name).join(', '));
    }
    
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

// Alternative approach - just print instructions
console.log('\n========================================');
console.log('ELO System Fix Migration Instructions');
console.log('========================================\n');
console.log('This migration fixes the following issues:');
console.log('1. Updates save_round_replay function to use custom users table');
console.log('2. Adds missing columns to ranked_matches table');
console.log('3. Creates helper functions with proper user table references');
console.log('4. Creates a view for camelCase compatibility\n');
console.log('To run this migration:');
console.log('1. Go to your Supabase dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste the contents of:');
console.log('   server/migrations/015_fix_elo_schema_issues.sql');
console.log('4. Click "Run" to execute the migration\n');
console.log('The migration file has been created at:');
console.log(path.join(__dirname, '..', 'migrations', '015_fix_elo_schema_issues.sql'));
console.log('\n========================================\n');

// Optionally try to run it
runMigration().catch(console.error);
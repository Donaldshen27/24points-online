import { supabase } from '../src/db/supabase';
import fs from 'fs';
import path from 'path';

async function runMigration(migrationFile: string) {
  if (!supabase) {
    console.error('Supabase not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    process.exit(1);
  }

  try {
    console.log(`Running migration: ${migrationFile}`);
    
    const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If RPC doesn't exist, try direct query (this might not work with RLS)
      console.error('RPC exec_sql not available, migration needs to be run manually:', error);
      console.log('\nPlease run this migration directly in your Supabase SQL editor:');
      console.log('File:', migrationPath);
      return;
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Usage: npm run migrate <migration-file>');
  process.exit(1);
}

runMigration(migrationFile);
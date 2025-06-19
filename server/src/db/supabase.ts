import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database types
export interface PuzzleRecord {
  puzzle_key: string;
  cards: number[];
  occurrence_count: number;
  first_seen: Date;
  last_seen: Date;
}

export interface SolveRecord {
  id?: number;
  puzzle_key: string;
  username: string;
  solve_time_ms: number;
  solution?: string;
  created_at: Date;
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Create client only if credentials are provided
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Check if database is configured
export const isDatabaseConfigured = () => {
  return supabase !== null;
};

// Log database status
if (isDatabaseConfigured()) {
  console.log('Supabase database configured');
} else {
  console.log('Supabase database not configured - using in-memory storage');
}
-- Migration: Fix RLS policies and ensure replay function exists
-- This migration fixes:
-- 1. RLS policies for ranked_matches to allow service role to insert
-- 2. Ensures save_round_replay function exists and uses correct user table

-- Fix 1: Update RLS policies for ranked_matches to properly allow service role
-- Drop existing policies that may be blocking inserts
DROP POLICY IF EXISTS "Users can view all matches" ON ranked_matches;
DROP POLICY IF EXISTS "System can create matches" ON ranked_matches;
DROP POLICY IF EXISTS "Anyone can view matches" ON ranked_matches;
DROP POLICY IF EXISTS "Service role can manage matches" ON ranked_matches;

-- Create comprehensive policies for ranked_matches
-- Allow anyone to view matches
CREATE POLICY "Anyone can view matches" ON ranked_matches
  FOR SELECT USING (true);

-- Allow service role full access (this is what the backend uses)
CREATE POLICY "Service role has full access" ON ranked_matches
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Optional: Allow authenticated users to view their own matches
CREATE POLICY "Users can view own matches" ON ranked_matches
  FOR SELECT 
  TO authenticated
  USING (player1_id = auth.uid() OR player2_id = auth.uid());

-- Fix 2: Ensure match_replays table has proper RLS policies
DROP POLICY IF EXISTS "Users can view all match replays" ON match_replays;
DROP POLICY IF EXISTS "System can manage match replays" ON match_replays;

-- Allow anyone to view replays
CREATE POLICY "Anyone can view replays" ON match_replays
  FOR SELECT USING (true);

-- Allow service role full access
CREATE POLICY "Service role has full access to replays" ON match_replays
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix 3: Recreate save_round_replay function to ensure it exists and uses correct table
DROP FUNCTION IF EXISTS save_round_replay(UUID, INTEGER, JSONB, JSONB, UUID, INTEGER, JSONB, JSONB);

CREATE OR REPLACE FUNCTION save_round_replay(
  p_match_id UUID,
  p_round_number INTEGER,
  p_center_cards JSONB,
  p_solution JSONB,
  p_solver_id UUID,
  p_solve_time_ms INTEGER,
  p_game_state_before JSONB DEFAULT NULL,
  p_game_state_after JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_replay_id UUID;
BEGIN
  -- Insert replay data
  INSERT INTO match_replays (
    match_id,
    round_number,
    center_cards,
    solution,
    solver_id,
    solve_time_ms,
    game_state_before,
    game_state_after
  ) VALUES (
    p_match_id,
    p_round_number,
    p_center_cards,
    p_solution,
    p_solver_id,
    p_solve_time_ms,
    p_game_state_before,
    p_game_state_after
  ) RETURNING id INTO v_replay_id;
  
  -- Mark match as having replay
  UPDATE ranked_matches 
  SET has_replay = true 
  WHERE id = p_match_id;
  
  RETURN v_replay_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION save_round_replay TO service_role;

-- Fix 4: Also update other ELO-related tables to ensure service role can manage them
-- Player ratings
DROP POLICY IF EXISTS "Users can view all ratings" ON player_ratings;
DROP POLICY IF EXISTS "System can manage ratings" ON player_ratings;
DROP POLICY IF EXISTS "Service role can manage ratings" ON player_ratings;
DROP POLICY IF EXISTS "Users can view own rating" ON player_ratings;

CREATE POLICY "Anyone can view ratings" ON player_ratings
  FOR SELECT USING (true);

CREATE POLICY "Service role has full access to ratings" ON player_ratings
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Seasonal ratings
DROP POLICY IF EXISTS "Users can view all seasonal ratings" ON seasonal_ratings;
DROP POLICY IF EXISTS "System can manage seasonal ratings" ON seasonal_ratings;

CREATE POLICY "Anyone can view seasonal ratings" ON seasonal_ratings
  FOR SELECT USING (true);

CREATE POLICY "Service role has full access to seasonal ratings" ON seasonal_ratings
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix 5: Ensure all required columns exist on ranked_matches
-- Check and add missing columns that might be causing issues
DO $$
BEGIN
  -- Add game_mode if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ranked_matches' 
                 AND column_name = 'game_mode') THEN
    ALTER TABLE ranked_matches ADD COLUMN game_mode VARCHAR(20) DEFAULT 'classic';
  END IF;

  -- Add disconnect_forfeit if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ranked_matches' 
                 AND column_name = 'disconnect_forfeit') THEN
    ALTER TABLE ranked_matches ADD COLUMN disconnect_forfeit BOOLEAN DEFAULT false;
  END IF;

  -- Add solve time tracking columns if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ranked_matches' 
                 AND column_name = 'player1_solve_times') THEN
    ALTER TABLE ranked_matches ADD COLUMN player1_solve_times JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ranked_matches' 
                 AND column_name = 'player2_solve_times') THEN
    ALTER TABLE ranked_matches ADD COLUMN player2_solve_times JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add first solve tracking columns if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ranked_matches' 
                 AND column_name = 'player1_first_solves') THEN
    ALTER TABLE ranked_matches ADD COLUMN player1_first_solves INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ranked_matches' 
                 AND column_name = 'player2_first_solves') THEN
    ALTER TABLE ranked_matches ADD COLUMN player2_first_solves INTEGER DEFAULT 0;
  END IF;

  -- Add average solve time columns if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ranked_matches' 
                 AND column_name = 'player1_avg_solve_time_ms') THEN
    ALTER TABLE ranked_matches ADD COLUMN player1_avg_solve_time_ms INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ranked_matches' 
                 AND column_name = 'player2_avg_solve_time_ms') THEN
    ALTER TABLE ranked_matches ADD COLUMN player2_avg_solve_time_ms INTEGER;
  END IF;

  -- Add replay_data if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ranked_matches' 
                 AND column_name = 'replay_data') THEN
    ALTER TABLE ranked_matches ADD COLUMN replay_data JSONB;
  END IF;

  -- Add match_statistics if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ranked_matches' 
                 AND column_name = 'match_statistics') THEN
    ALTER TABLE ranked_matches ADD COLUMN match_statistics JSONB;
  END IF;
END $$;

-- Fix 6: Update foreign key constraints on match_replays if needed
-- Check if solver_id references auth.users and update to users table
DO $$
BEGIN
  -- First check if the users table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_name = 'users' 
             AND table_schema = 'public') THEN
    -- Drop old constraint if it exists
    ALTER TABLE match_replays DROP CONSTRAINT IF EXISTS match_replays_solver_id_fkey;
    
    -- Add new constraint referencing users table
    ALTER TABLE match_replays 
      ADD CONSTRAINT match_replays_solver_id_fkey 
      FOREIGN KEY (solver_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Verify all tables have RLS enabled
ALTER TABLE ranked_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_replays ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_ratings ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON ranked_matches TO service_role;
GRANT ALL ON match_replays TO service_role;
GRANT ALL ON player_ratings TO service_role;
GRANT ALL ON seasonal_ratings TO service_role;

GRANT SELECT ON ranked_matches TO anon, authenticated;
GRANT SELECT ON match_replays TO anon, authenticated;
GRANT SELECT ON player_ratings TO anon, authenticated;
GRANT SELECT ON seasonal_ratings TO anon, authenticated;

-- Migration completed successfully
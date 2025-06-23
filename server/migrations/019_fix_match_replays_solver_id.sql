-- Migration: Fix match_replays solver_id column and foreign key
-- This migration ensures the solver_id column exists before adding foreign key constraints

-- First, check if match_replays table exists and create it if not
CREATE TABLE IF NOT EXISTS match_replays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL,
  round_number INTEGER NOT NULL CHECK (round_number > 0),
  center_cards JSONB NOT NULL,
  solution JSONB NOT NULL,
  solve_time_ms INTEGER NOT NULL CHECK (solve_time_ms > 0),
  game_state_before JSONB,
  game_state_after JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add solver_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'match_replays' 
                 AND column_name = 'solver_id') THEN
    ALTER TABLE match_replays ADD COLUMN solver_id UUID NOT NULL;
  END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  -- Check and add foreign key for match_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'match_replays_match_id_fkey'
    AND table_name = 'match_replays'
  ) THEN
    ALTER TABLE match_replays 
      ADD CONSTRAINT match_replays_match_id_fkey 
      FOREIGN KEY (match_id) REFERENCES ranked_matches(id) ON DELETE CASCADE;
  END IF;

  -- Drop old solver_id constraint if it exists (might reference auth.users)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'match_replays_solver_id_fkey'
    AND table_name = 'match_replays'
  ) THEN
    ALTER TABLE match_replays DROP CONSTRAINT match_replays_solver_id_fkey;
  END IF;
  
  -- Add new solver_id constraint referencing public users table
  ALTER TABLE match_replays 
    ADD CONSTRAINT match_replays_solver_id_fkey 
    FOREIGN KEY (solver_id) REFERENCES users(id) ON DELETE CASCADE;
END $$;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'match_replays_match_id_round_number_key'
    AND table_name = 'match_replays'
  ) THEN
    ALTER TABLE match_replays 
      ADD CONSTRAINT match_replays_match_id_round_number_key 
      UNIQUE(match_id, round_number);
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_match_replays_match_id ON match_replays(match_id);
CREATE INDEX IF NOT EXISTS idx_match_replays_solver ON match_replays(solver_id);

-- Add columns to ranked_matches if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ranked_matches' 
                 AND column_name = 'has_replay') THEN
    ALTER TABLE ranked_matches ADD COLUMN has_replay BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ranked_matches' 
                 AND column_name = 'replay_version') THEN
    ALTER TABLE ranked_matches ADD COLUMN replay_version INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ranked_matches' 
                 AND column_name = 'final_game_state') THEN
    ALTER TABLE ranked_matches ADD COLUMN final_game_state JSONB;
  END IF;
END $$;

-- Create index on has_replay if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_ranked_matches_has_replay 
  ON ranked_matches(has_replay) 
  WHERE has_replay = true;

-- Enable RLS
ALTER TABLE match_replays ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all match replays" ON match_replays;
DROP POLICY IF EXISTS "System can manage match replays" ON match_replays;
DROP POLICY IF EXISTS "Anyone can view replays" ON match_replays;
DROP POLICY IF EXISTS "Service role has full access to replays" ON match_replays;

-- Create new RLS policies
CREATE POLICY "Anyone can view replays" ON match_replays
  FOR SELECT USING (true);

CREATE POLICY "Service role has full access to replays" ON match_replays
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Recreate save_round_replay function with correct user table reference
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

-- Recreate get_match_replay function with correct user table reference
DROP FUNCTION IF EXISTS get_match_replay(UUID);

CREATE OR REPLACE FUNCTION get_match_replay(
  p_match_id UUID
) RETURNS TABLE (
  match_data JSONB,
  rounds JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH match_info AS (
    SELECT 
      jsonb_build_object(
        'id', rm.id,
        'player1', jsonb_build_object(
          'id', rm.player1_id,
          'username', u1.username,
          'ratingBefore', rm.player1_rating_before,
          'ratingAfter', rm.player1_rating_after,
          'roundsWon', rm.player1_rounds_won
        ),
        'player2', jsonb_build_object(
          'id', rm.player2_id,
          'username', u2.username,
          'ratingBefore', rm.player2_rating_before,
          'ratingAfter', rm.player2_rating_after,
          'roundsWon', rm.player2_rounds_won
        ),
        'winnerId', rm.winner_id,
        'gameMode', rm.game_mode,
        'duration', rm.match_duration,
        'totalRounds', rm.rounds_played,
        'createdAt', rm.created_at,
        'finalState', rm.final_game_state
      ) as match_data
    FROM ranked_matches rm
    JOIN users u1 ON rm.player1_id = u1.id
    JOIN users u2 ON rm.player2_id = u2.id
    WHERE rm.id = p_match_id
  ),
  replay_rounds AS (
    SELECT 
      jsonb_agg(
        jsonb_build_object(
          'roundNumber', mr.round_number,
          'centerCards', mr.center_cards,
          'solution', mr.solution,
          'solverId', mr.solver_id,
          'solveTimeMs', mr.solve_time_ms,
          'gameStateBefore', mr.game_state_before,
          'gameStateAfter', mr.game_state_after
        ) ORDER BY mr.round_number
      ) as rounds
    FROM match_replays mr
    WHERE mr.match_id = p_match_id
  )
  SELECT 
    mi.match_data,
    COALESCE(rr.rounds, '[]'::jsonb) as rounds
  FROM match_info mi
  CROSS JOIN replay_rounds rr;
END;
$$ LANGUAGE plpgsql;

-- Recreate get_player_replays function with correct user table reference
DROP FUNCTION IF EXISTS get_player_replays(UUID, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_player_replays(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  match_id UUID,
  opponent_id UUID,
  opponent_name VARCHAR(50),
  won BOOLEAN,
  game_mode VARCHAR(20),
  rounds_played INTEGER,
  rating_change INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rm.id as match_id,
    CASE 
      WHEN rm.player1_id = p_user_id THEN rm.player2_id 
      ELSE rm.player1_id 
    END as opponent_id,
    CASE 
      WHEN rm.player1_id = p_user_id THEN u2.username 
      ELSE u1.username 
    END as opponent_name,
    rm.winner_id = p_user_id as won,
    rm.game_mode,
    rm.rounds_played,
    CASE 
      WHEN rm.player1_id = p_user_id THEN rm.player1_rating_after - rm.player1_rating_before
      ELSE rm.player2_rating_after - rm.player2_rating_before
    END as rating_change,
    rm.created_at
  FROM ranked_matches rm
  JOIN users u1 ON rm.player1_id = u1.id
  JOIN users u2 ON rm.player2_id = u2.id
  WHERE (rm.player1_id = p_user_id OR rm.player2_id = p_user_id)
    AND rm.has_replay = true
  ORDER BY rm.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON match_replays TO service_role;
GRANT SELECT ON match_replays TO anon, authenticated;
GRANT EXECUTE ON FUNCTION save_round_replay TO service_role;
GRANT EXECUTE ON FUNCTION get_match_replay TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_player_replays TO anon, authenticated;

-- Update RLS policies for ranked_matches (from original migration)
DROP POLICY IF EXISTS "Users can view all matches" ON ranked_matches;
DROP POLICY IF EXISTS "System can create matches" ON ranked_matches;
DROP POLICY IF EXISTS "Anyone can view matches" ON ranked_matches;
DROP POLICY IF EXISTS "Service role can manage matches" ON ranked_matches;
DROP POLICY IF EXISTS "Service role has full access" ON ranked_matches;
DROP POLICY IF EXISTS "Users can view own matches" ON ranked_matches;

-- Create comprehensive policies for ranked_matches
CREATE POLICY "Anyone can view matches" ON ranked_matches
  FOR SELECT USING (true);

CREATE POLICY "Service role has full access" ON ranked_matches
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Also update other ELO-related tables to ensure service role can manage them
-- Player ratings
DROP POLICY IF EXISTS "Users can view all ratings" ON player_ratings;
DROP POLICY IF EXISTS "System can manage ratings" ON player_ratings;
DROP POLICY IF EXISTS "Service role can manage ratings" ON player_ratings;
DROP POLICY IF EXISTS "Users can view own rating" ON player_ratings;
DROP POLICY IF EXISTS "Anyone can view ratings" ON player_ratings;
DROP POLICY IF EXISTS "Service role has full access to ratings" ON player_ratings;

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
DROP POLICY IF EXISTS "Anyone can view seasonal ratings" ON seasonal_ratings;
DROP POLICY IF EXISTS "Service role has full access to seasonal ratings" ON seasonal_ratings;

CREATE POLICY "Anyone can view seasonal ratings" ON seasonal_ratings
  FOR SELECT USING (true);

CREATE POLICY "Service role has full access to seasonal ratings" ON seasonal_ratings
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure all required columns exist on ranked_matches
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
-- Fix ELO system schema issues
-- 1. Fix save_round_replay function to use custom users table instead of auth.users
-- 2. Add missing columns that the TypeScript code expects

-- First, let's add any missing columns to ranked_matches
ALTER TABLE ranked_matches
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS player1_rating_change INTEGER GENERATED ALWAYS AS (player1_rating_after - player1_rating_before) STORED,
  ADD COLUMN IF NOT EXISTS player2_rating_change INTEGER GENERATED ALWAYS AS (player2_rating_after - player2_rating_before) STORED;

-- Update the match_duration column name to duration_seconds if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ranked_matches' 
    AND column_name = 'match_duration'
    AND column_name != 'duration_seconds'
  ) THEN
    ALTER TABLE ranked_matches RENAME COLUMN match_duration TO duration_seconds;
  END IF;
END $$;

-- Drop and recreate the save_round_replay function to use custom users table
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
$$ LANGUAGE plpgsql;

-- Update match_replays table foreign key if needed
ALTER TABLE match_replays DROP CONSTRAINT IF EXISTS match_replays_solver_id_fkey;
ALTER TABLE match_replays 
  ADD CONSTRAINT match_replays_solver_id_fkey 
  FOREIGN KEY (solver_id) REFERENCES users(id) ON DELETE CASCADE;

-- Drop and recreate get_match_replay function to use custom users table
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
        'duration', rm.duration_seconds,
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

-- Drop and recreate get_player_replays function to use custom users table
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

-- Update get_match_analytics function to use custom users table
DROP FUNCTION IF EXISTS get_match_analytics(UUID, INTEGER, INTEGER, VARCHAR(20), TIMESTAMPTZ, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION get_match_analytics(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_game_mode VARCHAR(20) DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
) RETURNS TABLE (
  match_id UUID,
  opponent_id UUID,
  opponent_name VARCHAR(50),
  won BOOLEAN,
  game_mode VARCHAR(20),
  duration_seconds INTEGER,
  rounds_played INTEGER,
  rounds_won INTEGER,
  first_solves INTEGER,
  avg_solve_time_ms INTEGER,
  rating_before INTEGER,
  rating_after INTEGER,
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
    rm.duration_seconds,
    rm.rounds_played,
    CASE 
      WHEN rm.player1_id = p_user_id THEN rm.player1_rounds_won 
      ELSE rm.player2_rounds_won 
    END as rounds_won,
    CASE 
      WHEN rm.player1_id = p_user_id THEN rm.player1_first_solves 
      ELSE rm.player2_first_solves 
    END as first_solves,
    CASE 
      WHEN rm.player1_id = p_user_id THEN rm.player1_avg_solve_time_ms 
      ELSE rm.player2_avg_solve_time_ms 
    END as avg_solve_time_ms,
    CASE 
      WHEN rm.player1_id = p_user_id THEN rm.player1_rating_before 
      ELSE rm.player2_rating_before 
    END as rating_before,
    CASE 
      WHEN rm.player1_id = p_user_id THEN rm.player1_rating_after 
      ELSE rm.player2_rating_after 
    END as rating_after,
    CASE 
      WHEN rm.player1_id = p_user_id THEN rm.player1_rating_after - rm.player1_rating_before 
      ELSE rm.player2_rating_after - rm.player2_rating_before 
    END as rating_change,
    rm.created_at
  FROM ranked_matches rm
  LEFT JOIN users u1 ON rm.player1_id = u1.id
  LEFT JOIN users u2 ON rm.player2_id = u2.id
  WHERE (rm.player1_id = p_user_id OR rm.player2_id = p_user_id)
    AND (p_game_mode IS NULL OR rm.game_mode = p_game_mode)
    AND (p_start_date IS NULL OR rm.created_at >= p_start_date)
    AND (p_end_date IS NULL OR rm.created_at <= p_end_date)
  ORDER BY rm.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Re-grant permissions for the updated functions
GRANT EXECUTE ON FUNCTION save_round_replay TO service_role;
GRANT EXECUTE ON FUNCTION get_match_replay TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_player_replays TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_match_analytics TO anon, authenticated;

-- Create a view to map snake_case to camelCase for TypeScript compatibility
-- This helps avoid changing all the TypeScript code
CREATE OR REPLACE VIEW ranked_matches_view AS
SELECT 
  id,
  player1_id as "player1Id",
  player2_id as "player2Id", 
  winner_id as "winnerId",
  player1_rating_before as "player1RatingBefore",
  player2_rating_before as "player2RatingBefore",
  player1_rating_after as "player1RatingAfter",
  player2_rating_after as "player2RatingAfter",
  rating_change as "ratingChange",
  duration_seconds as "matchDuration",
  rounds_played as "roundsPlayed",
  player1_rounds_won as "player1RoundsWon",
  player2_rounds_won as "player2RoundsWon",
  season_id as "seasonId",
  created_at as "createdAt",
  game_mode as "gameMode",
  disconnect_forfeit as "disconnectForfeit",
  player1_solve_times as "player1SolveTimes",
  player2_solve_times as "player2SolveTimes",
  player1_first_solves as "player1FirstSolves",
  player2_first_solves as "player2FirstSolves",
  player1_avg_solve_time_ms as "player1AvgSolveTimeMs",
  player2_avg_solve_time_ms as "player2AvgSolveTimeMs",
  replay_data as "replayData",
  match_statistics as "matchStatistics",
  has_replay as "hasReplay",
  replay_version as "replayVersion",
  final_game_state as "finalGameState",
  player1_rating_change as "player1RatingChange",
  player2_rating_change as "player2RatingChange"
FROM ranked_matches;

-- Grant permissions on the view
GRANT SELECT ON ranked_matches_view TO anon, authenticated;
GRANT ALL ON ranked_matches_view TO service_role;
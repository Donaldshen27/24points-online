-- Match replay system for ranked games

-- Create match replays table
CREATE TABLE IF NOT EXISTS match_replays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES ranked_matches(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL CHECK (round_number > 0),
  center_cards JSONB NOT NULL,
  solution JSONB NOT NULL,
  solver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  solve_time_ms INTEGER NOT NULL CHECK (solve_time_ms > 0),
  game_state_before JSONB, -- Optional: game state before the round
  game_state_after JSONB,  -- Optional: game state after the round
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(match_id, round_number)
);

-- Add replay metadata to ranked_matches
ALTER TABLE ranked_matches
  ADD COLUMN IF NOT EXISTS has_replay BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS replay_version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS final_game_state JSONB;

-- Create indexes for efficient replay queries
CREATE INDEX IF NOT EXISTS idx_match_replays_match_id ON match_replays(match_id);
CREATE INDEX IF NOT EXISTS idx_match_replays_solver ON match_replays(solver_id);
CREATE INDEX IF NOT EXISTS idx_ranked_matches_has_replay ON ranked_matches(has_replay) WHERE has_replay = true;

-- Function to save replay data for a round
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

-- Function to get full match replay
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
    JOIN auth.users u1 ON rm.player1_id = u1.id
    JOIN auth.users u2 ON rm.player2_id = u2.id
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

-- Function to get recent replays for a player
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
  JOIN auth.users u1 ON rm.player1_id = u1.id
  JOIN auth.users u2 ON rm.player2_id = u2.id
  WHERE (rm.player1_id = p_user_id OR rm.player2_id = p_user_id)
    AND rm.has_replay = true
  ORDER BY rm.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on match_replays
ALTER TABLE match_replays ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view all match replays" ON match_replays
  FOR SELECT USING (true);

CREATE POLICY "System can manage match replays" ON match_replays
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Grant permissions
GRANT SELECT ON match_replays TO anon, authenticated;
GRANT ALL ON match_replays TO service_role;
GRANT EXECUTE ON FUNCTION save_round_replay TO service_role;
GRANT EXECUTE ON FUNCTION get_match_replay TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_player_replays TO anon, authenticated;
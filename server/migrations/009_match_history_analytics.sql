-- Enhanced match history and analytics tables

-- Add more detailed fields to ranked_matches table
ALTER TABLE ranked_matches 
  ADD COLUMN IF NOT EXISTS game_mode VARCHAR(20) DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS disconnect_forfeit BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS player1_solve_times JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS player2_solve_times JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS player1_first_solves INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS player2_first_solves INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS player1_avg_solve_time_ms INTEGER,
  ADD COLUMN IF NOT EXISTS player2_avg_solve_time_ms INTEGER,
  ADD COLUMN IF NOT EXISTS replay_data JSONB,
  ADD COLUMN IF NOT EXISTS match_statistics JSONB DEFAULT '{}';

-- Create round details table for detailed analytics
CREATE TABLE IF NOT EXISTS match_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES ranked_matches(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL CHECK (round_number > 0),
  center_cards JSONB NOT NULL,
  solution JSONB,
  solver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  solve_time_ms INTEGER CHECK (solve_time_ms > 0),
  is_timeout BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(match_id, round_number)
);

-- Create player performance analytics table
CREATE TABLE IF NOT EXISTS player_performance_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_solve_time_ms BIGINT DEFAULT 0,
  total_rounds_played INTEGER DEFAULT 0,
  total_first_solves INTEGER DEFAULT 0,
  fastest_solve_ms INTEGER,
  avg_solve_time_ms INTEGER GENERATED ALWAYS AS (
    CASE WHEN total_first_solves > 0 
    THEN (total_solve_time_ms / total_first_solves)::INTEGER 
    ELSE NULL END
  ) STORED,
  favorite_game_mode VARCHAR(20),
  win_rate_by_mode JSONB DEFAULT '{}',
  hourly_performance JSONB DEFAULT '{}', -- Track performance by hour of day
  opponent_statistics JSONB DEFAULT '{}', -- Track performance against specific opponents
  streak_statistics JSONB DEFAULT '{"current_win": 0, "current_loss": 0, "best_win": 0, "worst_loss": 0}',
  last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create match search indexes
CREATE INDEX IF NOT EXISTS idx_match_rounds_match_id ON match_rounds(match_id);
CREATE INDEX IF NOT EXISTS idx_match_rounds_solver ON match_rounds(solver_id) WHERE solver_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ranked_matches_game_mode ON ranked_matches(game_mode);
CREATE INDEX IF NOT EXISTS idx_ranked_matches_disconnect ON ranked_matches(disconnect_forfeit) WHERE disconnect_forfeit = true;
CREATE INDEX IF NOT EXISTS idx_player_performance_updated ON player_performance_stats(last_updated DESC);

-- Function to update player performance stats after a match
CREATE OR REPLACE FUNCTION update_player_performance_after_match(
  p_match_id UUID
) RETURNS void AS $$
DECLARE
  v_match ranked_matches%ROWTYPE;
  v_player1_solve_count INTEGER;
  v_player2_solve_count INTEGER;
  v_player1_total_time BIGINT;
  v_player2_total_time BIGINT;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM ranked_matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found: %', p_match_id;
  END IF;
  
  -- Calculate solve statistics from match data
  v_player1_solve_count := COALESCE(array_length(v_match.player1_solve_times::INTEGER[], 1), 0);
  v_player2_solve_count := COALESCE(array_length(v_match.player2_solve_times::INTEGER[], 1), 0);
  
  -- Calculate total solve times
  SELECT COALESCE(SUM(value::INTEGER), 0) INTO v_player1_total_time
  FROM jsonb_array_elements_text(v_match.player1_solve_times);
  
  SELECT COALESCE(SUM(value::INTEGER), 0) INTO v_player2_total_time
  FROM jsonb_array_elements_text(v_match.player2_solve_times);
  
  -- Update player 1 stats
  INSERT INTO player_performance_stats (
    user_id,
    total_solve_time_ms,
    total_rounds_played,
    total_first_solves,
    fastest_solve_ms
  ) VALUES (
    v_match.player1_id,
    v_player1_total_time,
    v_match.rounds_played,
    v_match.player1_first_solves,
    CASE WHEN v_player1_solve_count > 0 
      THEN (SELECT MIN(value::INTEGER) FROM jsonb_array_elements_text(v_match.player1_solve_times))
      ELSE NULL 
    END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_solve_time_ms = player_performance_stats.total_solve_time_ms + v_player1_total_time,
    total_rounds_played = player_performance_stats.total_rounds_played + v_match.rounds_played,
    total_first_solves = player_performance_stats.total_first_solves + v_match.player1_first_solves,
    fastest_solve_ms = LEAST(
      player_performance_stats.fastest_solve_ms, 
      CASE WHEN v_player1_solve_count > 0 
        THEN (SELECT MIN(value::INTEGER) FROM jsonb_array_elements_text(v_match.player1_solve_times))
        ELSE player_performance_stats.fastest_solve_ms 
      END
    ),
    last_updated = NOW();
  
  -- Update player 2 stats  
  INSERT INTO player_performance_stats (
    user_id,
    total_solve_time_ms,
    total_rounds_played,
    total_first_solves,
    fastest_solve_ms
  ) VALUES (
    v_match.player2_id,
    v_player2_total_time,
    v_match.rounds_played,
    v_match.player2_first_solves,
    CASE WHEN v_player2_solve_count > 0 
      THEN (SELECT MIN(value::INTEGER) FROM jsonb_array_elements_text(v_match.player2_solve_times))
      ELSE NULL 
    END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_solve_time_ms = player_performance_stats.total_solve_time_ms + v_player2_total_time,
    total_rounds_played = player_performance_stats.total_rounds_played + v_match.rounds_played,
    total_first_solves = player_performance_stats.total_first_solves + v_match.player2_first_solves,
    fastest_solve_ms = LEAST(
      player_performance_stats.fastest_solve_ms, 
      CASE WHEN v_player2_solve_count > 0 
        THEN (SELECT MIN(value::INTEGER) FROM jsonb_array_elements_text(v_match.player2_solve_times))
        ELSE player_performance_stats.fastest_solve_ms 
      END
    ),
    last_updated = NOW();
    
  -- Update mode-specific win rates
  PERFORM update_player_mode_statistics(v_match.player1_id, v_match.game_mode, v_match.winner_id = v_match.player1_id);
  PERFORM update_player_mode_statistics(v_match.player2_id, v_match.game_mode, v_match.winner_id = v_match.player2_id);
  
  -- Update opponent statistics
  PERFORM update_opponent_statistics(v_match.player1_id, v_match.player2_id, v_match.winner_id = v_match.player1_id);
  PERFORM update_opponent_statistics(v_match.player2_id, v_match.player1_id, v_match.winner_id = v_match.player2_id);
  
  -- Update streak statistics
  PERFORM update_streak_statistics(v_match.winner_id, true);
  PERFORM update_streak_statistics(
    CASE WHEN v_match.winner_id = v_match.player1_id THEN v_match.player2_id ELSE v_match.player1_id END, 
    false
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update mode-specific statistics
CREATE OR REPLACE FUNCTION update_player_mode_statistics(
  p_user_id UUID,
  p_game_mode VARCHAR(20),
  p_won BOOLEAN
) RETURNS void AS $$
BEGIN
  UPDATE player_performance_stats
  SET win_rate_by_mode = jsonb_set(
    jsonb_set(
      win_rate_by_mode,
      ARRAY[p_game_mode, 'played'],
      to_jsonb(COALESCE((win_rate_by_mode->p_game_mode->>'played')::INTEGER, 0) + 1)
    ),
    ARRAY[p_game_mode, 'won'],
    to_jsonb(COALESCE((win_rate_by_mode->p_game_mode->>'won')::INTEGER, 0) + CASE WHEN p_won THEN 1 ELSE 0 END)
  )
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update opponent statistics
CREATE OR REPLACE FUNCTION update_opponent_statistics(
  p_user_id UUID,
  p_opponent_id UUID,
  p_won BOOLEAN
) RETURNS void AS $$
DECLARE
  v_opponent_id_str TEXT;
BEGIN
  v_opponent_id_str := p_opponent_id::TEXT;
  
  UPDATE player_performance_stats
  SET opponent_statistics = jsonb_set(
    jsonb_set(
      opponent_statistics,
      ARRAY[v_opponent_id_str, 'played'],
      to_jsonb(COALESCE((opponent_statistics->v_opponent_id_str->>'played')::INTEGER, 0) + 1)
    ),
    ARRAY[v_opponent_id_str, 'won'],
    to_jsonb(COALESCE((opponent_statistics->v_opponent_id_str->>'won')::INTEGER, 0) + CASE WHEN p_won THEN 1 ELSE 0 END)
  )
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update streak statistics
CREATE OR REPLACE FUNCTION update_streak_statistics(
  p_user_id UUID,
  p_won BOOLEAN
) RETURNS void AS $$
DECLARE
  v_current_stats JSONB;
  v_new_win_streak INTEGER;
  v_new_loss_streak INTEGER;
BEGIN
  -- Get current streak stats
  SELECT streak_statistics INTO v_current_stats
  FROM player_performance_stats
  WHERE user_id = p_user_id;
  
  IF v_current_stats IS NULL THEN
    v_current_stats := '{"current_win": 0, "current_loss": 0, "best_win": 0, "worst_loss": 0}'::JSONB;
  END IF;
  
  -- Update streaks
  IF p_won THEN
    v_new_win_streak := COALESCE((v_current_stats->>'current_win')::INTEGER, 0) + 1;
    v_new_loss_streak := 0;
  ELSE
    v_new_win_streak := 0;
    v_new_loss_streak := COALESCE((v_current_stats->>'current_loss')::INTEGER, 0) + 1;
  END IF;
  
  -- Update the statistics
  UPDATE player_performance_stats
  SET streak_statistics = jsonb_build_object(
    'current_win', v_new_win_streak,
    'current_loss', v_new_loss_streak,
    'best_win', GREATEST(COALESCE((v_current_stats->>'best_win')::INTEGER, 0), v_new_win_streak),
    'worst_loss', GREATEST(COALESCE((v_current_stats->>'worst_loss')::INTEGER, 0), v_new_loss_streak)
  )
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get detailed match analytics
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
    rm.match_duration as duration_seconds,
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
  LEFT JOIN auth.users u1 ON rm.player1_id = u1.id
  LEFT JOIN auth.users u2 ON rm.player2_id = u2.id
  WHERE (rm.player1_id = p_user_id OR rm.player2_id = p_user_id)
    AND (p_game_mode IS NULL OR rm.game_mode = p_game_mode)
    AND (p_start_date IS NULL OR rm.created_at >= p_start_date)
    AND (p_end_date IS NULL OR rm.created_at <= p_end_date)
  ORDER BY rm.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on new tables
ALTER TABLE match_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_performance_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view all match rounds" ON match_rounds
  FOR SELECT USING (true);

CREATE POLICY "System can manage match rounds" ON match_rounds
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all performance stats" ON player_performance_stats
  FOR SELECT USING (true);

CREATE POLICY "System can manage performance stats" ON player_performance_stats
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Grant permissions
GRANT SELECT ON match_rounds TO anon, authenticated;
GRANT ALL ON match_rounds TO service_role;
GRANT SELECT ON player_performance_stats TO anon, authenticated;
GRANT ALL ON player_performance_stats TO service_role;
GRANT EXECUTE ON FUNCTION update_player_performance_after_match TO service_role;
GRANT EXECUTE ON FUNCTION get_match_analytics TO anon, authenticated;
-- Helper functions for statistics tracking

-- Function to increment a user statistic field
CREATE OR REPLACE FUNCTION increment_user_stat(
  p_user_id UUID,
  p_stat_field TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  -- Dynamically increment the specified field
  EXECUTE format(
    'UPDATE user_statistics SET %I = COALESCE(%I, 0) + $1, updated_at = NOW() WHERE user_id = $2',
    p_stat_field, p_stat_field
  ) USING p_increment, p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's puzzle record count
CREATE OR REPLACE FUNCTION get_user_puzzle_records(p_username VARCHAR(50))
RETURNS INTEGER AS $$
DECLARE
  record_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT sr.puzzle_key)
  INTO record_count
  FROM solve_records sr
  WHERE sr.username = p_username
  AND sr.solve_time_ms = (
    SELECT MIN(solve_time_ms)
    FROM solve_records sr2
    WHERE sr2.puzzle_key = sr.puzzle_key
  );
  
  RETURN COALESCE(record_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user has played with a specific opponent
CREATE OR REPLACE FUNCTION check_opponent_games(
  p_user_id UUID,
  p_opponent_id UUID,
  p_min_games INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  game_count INTEGER;
BEGIN
  -- This would require a game history table
  -- For now, return false as placeholder
  -- In production, you'd query a game_history table
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate accuracy rate
CREATE OR REPLACE FUNCTION calculate_accuracy_rate(
  p_correct_solutions INTEGER,
  p_incorrect_attempts INTEGER
)
RETURNS DECIMAL AS $$
DECLARE
  total_attempts INTEGER;
BEGIN
  total_attempts := p_correct_solutions + p_incorrect_attempts;
  
  IF total_attempts = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((p_correct_solutions::DECIMAL / total_attempts) * 100, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if it's a comeback win (was down 0-5)
CREATE OR REPLACE FUNCTION is_comeback_win(
  p_game_history JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
  -- This would analyze the game history to check if player was down 0-5
  -- Placeholder for now
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- View for user statistics with calculated fields
CREATE OR REPLACE VIEW user_statistics_extended AS
SELECT 
  us.*,
  CASE 
    WHEN us.total_correct_solutions + us.total_incorrect_attempts > 0 
    THEN calculate_accuracy_rate(us.total_correct_solutions, us.total_incorrect_attempts)
    ELSE 0
  END AS accuracy_rate,
  CASE
    WHEN us.games_played > 0
    THEN ROUND((us.games_won::DECIMAL / us.games_played) * 100, 2)
    ELSE 0
  END AS win_rate,
  CASE
    WHEN us.total_rounds_played > 0
    THEN ROUND(us.total_solve_time_ms::DECIMAL / us.total_rounds_played, 0)
    ELSE NULL
  END AS avg_solve_time_ms,
  get_user_puzzle_records(us.username) AS puzzle_records_held
FROM user_statistics us;

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_user_stat TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_puzzle_records TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_accuracy_rate TO authenticated;
GRANT SELECT ON user_statistics_extended TO authenticated;
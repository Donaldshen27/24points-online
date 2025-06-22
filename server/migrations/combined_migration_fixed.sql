-- Combined Migration Script for 24 Points Game (FIXED)
-- This script safely runs all migrations in order, checking for existing objects

-- ============================================
-- PART 1: Badge System Tables (from 002_badge_system.sql)
-- ============================================

-- Badge definitions table (stores all possible badges)
CREATE TABLE IF NOT EXISTS badge_definitions (
  id VARCHAR(50) PRIMARY KEY,
  category VARCHAR(30) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  tier VARCHAR(20),
  rarity VARCHAR(20) NOT NULL,
  points INTEGER DEFAULT 10,
  icon_url VARCHAR(255),
  requirements JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User statistics table (tracks cumulative stats for badge requirements)
CREATE TABLE IF NOT EXISTS user_statistics (
  user_id UUID PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  games_lost INTEGER DEFAULT 0,
  current_win_streak INTEGER DEFAULT 0,
  longest_win_streak INTEGER DEFAULT 0,
  total_rounds_played INTEGER DEFAULT 0,
  total_first_solves INTEGER DEFAULT 0,
  total_correct_solutions INTEGER DEFAULT 0,
  total_incorrect_attempts INTEGER DEFAULT 0,
  total_solve_time_ms BIGINT DEFAULT 0,
  fastest_solve_ms INTEGER,
  slowest_win_ms INTEGER,
  classic_wins INTEGER DEFAULT 0,
  super_mode_wins INTEGER DEFAULT 0,
  extended_range_wins INTEGER DEFAULT 0,
  solo_puzzles_completed INTEGER DEFAULT 0,
  consecutive_days_played INTEGER DEFAULT 0,
  last_played_date DATE,
  weekend_games INTEGER DEFAULT 0,
  night_games INTEGER DEFAULT 0,
  early_games INTEGER DEFAULT 0,
  unique_opponents INTEGER DEFAULT 0,
  games_spectated INTEGER DEFAULT 0,
  comeback_wins INTEGER DEFAULT 0,
  underdog_wins INTEGER DEFAULT 0,
  perfect_games INTEGER DEFAULT 0,
  flawless_victories INTEGER DEFAULT 0,
  total_cards_won INTEGER DEFAULT 0,
  total_cards_lost INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User badges table (tracks which badges each user has earned)
CREATE TABLE IF NOT EXISTS user_badges (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id VARCHAR(50) NOT NULL REFERENCES badge_definitions(id),
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress_when_unlocked JSONB,
  UNIQUE(user_id, badge_id)
);

-- Badge progress table (tracks progress towards unearned badges)
CREATE TABLE IF NOT EXISTS badge_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id VARCHAR(50) NOT NULL REFERENCES badge_definitions(id),
  current_progress JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Badge challenges table (for daily/weekly challenges)
CREATE TABLE IF NOT EXISTS badge_challenges (
  id BIGSERIAL PRIMARY KEY,
  badge_id VARCHAR(50) REFERENCES badge_definitions(id),
  challenge_type VARCHAR(20) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  requirements JSONB NOT NULL,
  bonus_points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_unlocked_at ON user_badges(unlocked_at DESC);
CREATE INDEX IF NOT EXISTS idx_badge_progress_user_id ON badge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_badge_progress_updated_at ON badge_progress(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_statistics_username ON user_statistics(username);
CREATE INDEX IF NOT EXISTS idx_user_statistics_games_won ON user_statistics(games_won DESC);
CREATE INDEX IF NOT EXISTS idx_badge_challenges_active ON badge_challenges(is_active, end_date) WHERE is_active = true;

-- ============================================
-- PART 2: Authentication System (from 003_auth_system.sql)
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  email_verified_at TIMESTAMPTZ,
  
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT username_format CHECK (username ~* '^[a-zA-Z0-9_-]{2,50}$')
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Authentication audit log
CREATE TABLE IF NOT EXISTS auth_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for auth tables
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON user_sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON auth_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON auth_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON auth_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires_at ON email_verification_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active) WHERE is_active = true;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions WHERE expires_at < NOW();
  DELETE FROM password_reset_tokens WHERE expires_at < NOW() AND used_at IS NULL;
  DELETE FROM email_verification_tokens WHERE expires_at < NOW() AND used_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 3: Badge System Guest Support (from 004_badge_system_guest_support.sql)
-- ============================================

-- Drop existing constraints that might prevent the changes
ALTER TABLE user_statistics DROP CONSTRAINT IF EXISTS user_statistics_pkey;
ALTER TABLE user_badges DROP CONSTRAINT IF EXISTS user_badges_user_id_fkey;
ALTER TABLE badge_progress DROP CONSTRAINT IF EXISTS badge_progress_user_id_fkey;

-- Change user_id columns to VARCHAR to support both UUID and string IDs
ALTER TABLE user_statistics 
  ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::text;

ALTER TABLE user_badges 
  ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::text;

ALTER TABLE badge_progress 
  ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::text;

-- Re-add primary key constraint for user_statistics
ALTER TABLE user_statistics 
  ADD PRIMARY KEY (user_id);

-- Create a function to check if a user_id is a valid UUID (authenticated user)
-- FIXED: Added IMMUTABLE declaration
CREATE OR REPLACE FUNCTION is_authenticated_user(user_id_param VARCHAR(255))
RETURNS BOOLEAN AS $$
BEGIN
  -- Try to cast to UUID, return false if it fails
  -- Check UUID format with regex instead of casting (more reliable and immutable)
  RETURN user_id_param ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_statistics_user_type ON user_statistics(is_authenticated_user(user_id));
CREATE INDEX IF NOT EXISTS idx_user_badges_user_type ON user_badges(is_authenticated_user(user_id));
CREATE INDEX IF NOT EXISTS idx_badge_progress_user_type ON badge_progress(is_authenticated_user(user_id));

-- Add a column to track whether stats belong to a guest or authenticated user
ALTER TABLE user_statistics
  ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;

-- Update existing data to mark non-UUID users as guests
UPDATE user_statistics
SET is_guest = NOT is_authenticated_user(user_id)
WHERE is_guest IS NULL;

-- Create a function to clean up old guest statistics
CREATE OR REPLACE FUNCTION cleanup_old_guest_stats(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_statistics
  WHERE is_guest = true 
    AND updated_at < NOW() - INTERVAL '1 day' * days_old
    AND games_played < 5;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 4: Statistics Functions (from 004_statistics_functions.sql if needed)
-- ============================================

-- Function to update user statistics after a game
CREATE OR REPLACE FUNCTION update_user_statistics_after_game(
  p_user_id VARCHAR(255),
  p_won BOOLEAN,
  p_rounds_played INTEGER,
  p_first_solves INTEGER,
  p_correct_solutions INTEGER,
  p_incorrect_attempts INTEGER,
  p_solve_time_ms BIGINT,
  p_cards_won INTEGER,
  p_cards_lost INTEGER,
  p_game_mode VARCHAR(50),
  p_is_comeback BOOLEAN DEFAULT false,
  p_is_underdog BOOLEAN DEFAULT false,
  p_is_perfect BOOLEAN DEFAULT false,
  p_is_flawless BOOLEAN DEFAULT false
)
RETURNS void AS $$
DECLARE
  v_current_hour INTEGER;
  v_is_weekend BOOLEAN;
BEGIN
  -- Determine time-based stats
  v_current_hour := EXTRACT(HOUR FROM NOW());
  v_is_weekend := EXTRACT(DOW FROM NOW()) IN (0, 6);
  
  -- Update or insert user statistics
  INSERT INTO user_statistics (
    user_id, username, games_played, games_won, games_lost,
    total_rounds_played, total_first_solves, total_correct_solutions,
    total_incorrect_attempts, total_solve_time_ms, total_cards_won, total_cards_lost,
    is_guest
  ) VALUES (
    p_user_id, p_user_id, 1, CASE WHEN p_won THEN 1 ELSE 0 END, CASE WHEN p_won THEN 0 ELSE 1 END,
    p_rounds_played, p_first_solves, p_correct_solutions,
    p_incorrect_attempts, p_solve_time_ms, p_cards_won, p_cards_lost,
    NOT is_authenticated_user(p_user_id)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    games_played = user_statistics.games_played + 1,
    games_won = user_statistics.games_won + CASE WHEN p_won THEN 1 ELSE 0 END,
    games_lost = user_statistics.games_lost + CASE WHEN p_won THEN 0 ELSE 1 END,
    current_win_streak = CASE 
      WHEN p_won THEN user_statistics.current_win_streak + 1 
      ELSE 0 
    END,
    longest_win_streak = CASE 
      WHEN p_won AND user_statistics.current_win_streak + 1 > user_statistics.longest_win_streak 
      THEN user_statistics.current_win_streak + 1 
      ELSE user_statistics.longest_win_streak 
    END,
    total_rounds_played = user_statistics.total_rounds_played + p_rounds_played,
    total_first_solves = user_statistics.total_first_solves + p_first_solves,
    total_correct_solutions = user_statistics.total_correct_solutions + p_correct_solutions,
    total_incorrect_attempts = user_statistics.total_incorrect_attempts + p_incorrect_attempts,
    total_solve_time_ms = user_statistics.total_solve_time_ms + p_solve_time_ms,
    total_cards_won = user_statistics.total_cards_won + p_cards_won,
    total_cards_lost = user_statistics.total_cards_lost + p_cards_lost,
    weekend_games = user_statistics.weekend_games + CASE WHEN v_is_weekend THEN 1 ELSE 0 END,
    night_games = user_statistics.night_games + CASE WHEN v_current_hour >= 22 OR v_current_hour < 4 THEN 1 ELSE 0 END,
    early_games = user_statistics.early_games + CASE WHEN v_current_hour >= 5 AND v_current_hour < 7 THEN 1 ELSE 0 END,
    comeback_wins = user_statistics.comeback_wins + CASE WHEN p_is_comeback AND p_won THEN 1 ELSE 0 END,
    underdog_wins = user_statistics.underdog_wins + CASE WHEN p_is_underdog AND p_won THEN 1 ELSE 0 END,
    perfect_games = user_statistics.perfect_games + CASE WHEN p_is_perfect THEN 1 ELSE 0 END,
    flawless_victories = user_statistics.flawless_victories + CASE WHEN p_is_flawless AND p_won THEN 1 ELSE 0 END,
    last_played_date = CURRENT_DATE,
    updated_at = NOW();
    
  -- Update mode-specific wins
  IF p_won THEN
    CASE p_game_mode
      WHEN 'classic' THEN
        UPDATE user_statistics SET classic_wins = classic_wins + 1 WHERE user_id = p_user_id;
      WHEN 'super' THEN
        UPDATE user_statistics SET super_mode_wins = super_mode_wins + 1 WHERE user_id = p_user_id;
      WHEN 'extended' THEN
        UPDATE user_statistics SET extended_range_wins = extended_range_wins + 1 WHERE user_id = p_user_id;
      ELSE
        -- Default to classic if mode not specified
        UPDATE user_statistics SET classic_wins = classic_wins + 1 WHERE user_id = p_user_id;
    END CASE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 5: Badge Leaderboard Function (from 005_badge_leaderboard_function.sql)
-- ============================================

-- Function to get badge leaderboard with user statistics and badge counts
CREATE OR REPLACE FUNCTION get_badge_leaderboard(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
  user_id VARCHAR(255),
  username VARCHAR(100),
  total_badges INTEGER,
  total_points INTEGER,
  legendary_count INTEGER,
  epic_count INTEGER,
  rare_count INTEGER,
  common_count INTEGER,
  games_won INTEGER,
  win_rate NUMERIC(5,2),
  is_guest BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH badge_counts AS (
    SELECT 
      ub.user_id,
      COUNT(*) as total_badges,
      SUM(bd.points) as total_points,
      COUNT(*) FILTER (WHERE bd.rarity = 'legendary') as legendary_count,
      COUNT(*) FILTER (WHERE bd.rarity = 'epic') as epic_count,
      COUNT(*) FILTER (WHERE bd.rarity = 'rare') as rare_count,
      COUNT(*) FILTER (WHERE bd.rarity = 'common') as common_count
    FROM user_badges ub
    JOIN badge_definitions bd ON ub.badge_id = bd.id
    GROUP BY ub.user_id
  )
  SELECT 
    us.user_id,
    us.username,
    COALESCE(bc.total_badges, 0)::INTEGER as total_badges,
    COALESCE(bc.total_points, 0)::INTEGER as total_points,
    COALESCE(bc.legendary_count, 0)::INTEGER as legendary_count,
    COALESCE(bc.epic_count, 0)::INTEGER as epic_count,
    COALESCE(bc.rare_count, 0)::INTEGER as rare_count,
    COALESCE(bc.common_count, 0)::INTEGER as common_count,
    us.games_won,
    CASE 
      WHEN us.games_played > 0 THEN ROUND((us.games_won::NUMERIC / us.games_played) * 100, 2)
      ELSE 0
    END as win_rate,
    us.is_guest
  FROM user_statistics us
  LEFT JOIN badge_counts bc ON us.user_id = bc.user_id
  WHERE us.games_played > 0
  ORDER BY 
    COALESCE(bc.total_points, 0) DESC,
    COALESCE(bc.legendary_count, 0) DESC,
    COALESCE(bc.epic_count, 0) DESC,
    us.games_won DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Add featured_badges column to user_statistics if it doesn't exist
ALTER TABLE user_statistics 
  ADD COLUMN IF NOT EXISTS featured_badges VARCHAR(50)[] DEFAULT '{}';

-- Create index for better performance on leaderboard queries
CREATE INDEX IF NOT EXISTS idx_user_statistics_games_played ON user_statistics(games_played DESC) WHERE games_played > 0;
CREATE INDEX IF NOT EXISTS idx_user_badges_user_points ON user_badges(user_id);

-- ============================================
-- PART 6: Grant Permissions
-- ============================================

-- Grant permissions for authenticated and anonymous users
GRANT SELECT ON badge_definitions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON user_statistics TO anon, authenticated;
GRANT SELECT, INSERT ON user_badges TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON badge_progress TO anon, authenticated;
GRANT SELECT ON badge_challenges TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_badge_leaderboard TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_user_statistics_after_game TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_authenticated_user TO anon, authenticated;

-- Grant necessary permissions to the anon role for auth tables
GRANT ALL ON users TO anon;
GRANT ALL ON user_sessions TO anon;
GRANT ALL ON auth_audit_logs TO anon;
GRANT ALL ON password_reset_tokens TO anon;
GRANT ALL ON email_verification_tokens TO anon;

-- Also grant permissions for sequences (for auto-incrementing IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant full permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================
-- FINAL: Success Message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run the badge definitions seed (003_badge_definitions_seed.sql) if you want pre-populated badges';
  RAISE NOTICE '2. Configure your environment variables:';
  RAISE NOTICE '   - SUPABASE_URL';
  RAISE NOTICE '   - SUPABASE_ANON_KEY';
  RAISE NOTICE '   - SUPABASE_SERVICE_KEY (optional)';
  RAISE NOTICE '3. Restart your server';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: RLS (Row Level Security) is disabled by default.';
  RAISE NOTICE 'Your backend server handles all access control.';
END $$;
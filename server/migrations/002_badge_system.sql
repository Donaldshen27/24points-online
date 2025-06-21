-- Badge System Schema for 24 Points Game
-- This migration adds support for a comprehensive badge/achievement system

-- Badge definitions table (stores all possible badges)
CREATE TABLE badge_definitions (
  id VARCHAR(50) PRIMARY KEY,              -- Unique badge identifier (e.g., 'speed_demon_bronze')
  category VARCHAR(30) NOT NULL,           -- Category: skill, progression, mode, social, unique, seasonal
  name VARCHAR(100) NOT NULL,              -- Display name
  description TEXT NOT NULL,               -- Badge description
  tier VARCHAR(20),                        -- Tier level: bronze, silver, gold, platinum, diamond
  rarity VARCHAR(20) NOT NULL,             -- Rarity: common, rare, epic, legendary
  points INTEGER DEFAULT 10,               -- Points awarded for earning this badge
  icon_url VARCHAR(255),                   -- Badge icon URL
  requirements JSONB NOT NULL,             -- JSON object with badge requirements
  is_active BOOLEAN DEFAULT true,          -- Whether badge can currently be earned
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User statistics table (tracks cumulative stats for badge requirements)
CREATE TABLE user_statistics (
  user_id UUID PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  
  -- Game statistics
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  games_lost INTEGER DEFAULT 0,
  current_win_streak INTEGER DEFAULT 0,
  longest_win_streak INTEGER DEFAULT 0,
  
  -- Performance statistics
  total_rounds_played INTEGER DEFAULT 0,
  total_first_solves INTEGER DEFAULT 0,
  total_correct_solutions INTEGER DEFAULT 0,
  total_incorrect_attempts INTEGER DEFAULT 0,
  fastest_solve_ms INTEGER,
  total_solve_time_ms BIGINT DEFAULT 0,
  
  -- Mode-specific statistics
  classic_wins INTEGER DEFAULT 0,
  super_mode_wins INTEGER DEFAULT 0,
  extended_range_wins INTEGER DEFAULT 0,
  solo_puzzles_completed INTEGER DEFAULT 0,
  
  -- Time-based statistics
  consecutive_days_played INTEGER DEFAULT 0,
  last_played_date DATE,
  weekend_games INTEGER DEFAULT 0,
  night_games INTEGER DEFAULT 0,        -- Games between midnight-6am
  early_games INTEGER DEFAULT 0,        -- Games between 5am-8am
  
  -- Social statistics
  unique_opponents INTEGER DEFAULT 0,
  games_spectated INTEGER DEFAULT 0,
  
  -- Special achievements tracking
  comeback_wins INTEGER DEFAULT 0,       -- Wins after being down 0-5
  underdog_wins INTEGER DEFAULT 0,       -- Wins against higher-ranked players
  perfect_games INTEGER DEFAULT 0,       -- Games with no incorrect attempts
  flawless_victories INTEGER DEFAULT 0,  -- 10-0 wins
  
  -- Aggregate statistics
  total_cards_won INTEGER DEFAULT 0,
  total_cards_lost INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User badges table (tracks which badges each user has earned)
CREATE TABLE user_badges (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id VARCHAR(50) NOT NULL REFERENCES badge_definitions(id),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress JSONB DEFAULT '{}',           -- Progress towards next tier
  is_featured BOOLEAN DEFAULT false,     -- Whether user has this badge featured on profile
  
  UNIQUE(user_id, badge_id)
);

-- Badge progress table (tracks progress towards incomplete badges)
CREATE TABLE badge_progress (
  user_id UUID NOT NULL,
  badge_id VARCHAR(50) NOT NULL REFERENCES badge_definitions(id),
  current_value INTEGER DEFAULT 0,       -- Current progress value
  target_value INTEGER NOT NULL,         -- Target value to earn badge
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  PRIMARY KEY (user_id, badge_id)
);

-- Daily/Weekly challenges table
CREATE TABLE badge_challenges (
  id SERIAL PRIMARY KEY,
  badge_id VARCHAR(50) NOT NULL REFERENCES badge_definitions(id),
  challenge_type VARCHAR(20) NOT NULL,   -- 'daily' or 'weekly'
  multiplier DECIMAL(3,2) DEFAULT 1.0,   -- Progress multiplier (e.g., 2x progress)
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Indexes for performance
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_featured ON user_badges(user_id, is_featured) WHERE is_featured = true;
CREATE INDEX idx_badge_progress_user ON badge_progress(user_id);
CREATE INDEX idx_badge_definitions_category ON badge_definitions(category);
CREATE INDEX idx_badge_definitions_active ON badge_definitions(is_active) WHERE is_active = true;
CREATE INDEX idx_challenges_active ON badge_challenges(is_active, end_date) WHERE is_active = true;
CREATE INDEX idx_user_stats_username ON user_statistics(username);

-- Enable Row Level Security
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Badge definitions are readable by everyone
CREATE POLICY "Badge definitions are viewable by everyone" ON badge_definitions
  FOR SELECT USING (true);

-- Users can read their own statistics
CREATE POLICY "Users can view own statistics" ON user_statistics
  FOR SELECT USING (auth.uid() = user_id);

-- Public leaderboard access for statistics (anonymous)
CREATE POLICY "Public can view statistics for leaderboard" ON user_statistics
  FOR SELECT USING (true);

-- Users can read their own badges
CREATE POLICY "Users can view own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read other users' featured badges
CREATE POLICY "Public can view featured badges" ON user_badges
  FOR SELECT USING (is_featured = true);

-- Users can view their own progress
CREATE POLICY "Users can view own badge progress" ON badge_progress
  FOR SELECT USING (auth.uid() = user_id);

-- Everyone can view active challenges
CREATE POLICY "Public can view active challenges" ON badge_challenges
  FOR SELECT USING (is_active = true);

-- Function to update user statistics timestamp
CREATE OR REPLACE FUNCTION update_user_statistics_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update timestamp
CREATE TRIGGER update_user_statistics_timestamp
BEFORE UPDATE ON user_statistics
FOR EACH ROW
EXECUTE FUNCTION update_user_statistics_timestamp();

-- Function to check and award badges after stats update
CREATE OR REPLACE FUNCTION check_badge_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be called from the application layer instead
  -- Keeping as placeholder for potential future use
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sample badge definitions will be inserted by the application
-- Example structure for requirements JSON:
-- {
--   "type": "games_won",
--   "value": 10,
--   "comparison": "gte"
-- }
-- OR for complex requirements:
-- {
--   "type": "and",
--   "conditions": [
--     {"type": "games_won", "value": 50, "comparison": "gte"},
--     {"type": "win_rate", "value": 0.7, "comparison": "gte"}
--   ]
-- }
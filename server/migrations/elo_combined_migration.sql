-- ELO Ranking System Combined Migration
-- This migration creates all tables required for the ELO ranking system

-- 1. Create player ratings table
CREATE TABLE IF NOT EXISTS player_ratings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_rating INTEGER DEFAULT 1200 NOT NULL CHECK (current_rating >= 400 AND current_rating <= 3000),
  peak_rating INTEGER DEFAULT 1200 NOT NULL CHECK (peak_rating >= 400 AND peak_rating <= 3000),
  games_played INTEGER DEFAULT 0 NOT NULL CHECK (games_played >= 0),
  wins INTEGER DEFAULT 0 NOT NULL CHECK (wins >= 0),
  losses INTEGER DEFAULT 0 NOT NULL CHECK (losses >= 0),
  win_streak INTEGER DEFAULT 0 NOT NULL CHECK (win_streak >= 0),
  loss_streak INTEGER DEFAULT 0 NOT NULL CHECK (loss_streak >= 0),
  last_game_at TIMESTAMPTZ,
  placement_matches_remaining INTEGER DEFAULT 10 NOT NULL CHECK (placement_matches_remaining >= 0 AND placement_matches_remaining <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT false NOT NULL,
  CONSTRAINT valid_season_dates CHECK (end_date > start_date)
);

-- 3. Create seasonal ratings table
CREATE TABLE IF NOT EXISTS seasonal_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  starting_rating INTEGER NOT NULL CHECK (starting_rating >= 400 AND starting_rating <= 3000),
  current_rating INTEGER NOT NULL CHECK (current_rating >= 400 AND current_rating <= 3000),
  peak_rating INTEGER NOT NULL CHECK (peak_rating >= 400 AND peak_rating <= 3000),
  games_played INTEGER DEFAULT 0 NOT NULL CHECK (games_played >= 0),
  wins INTEGER DEFAULT 0 NOT NULL CHECK (wins >= 0),
  losses INTEGER DEFAULT 0 NOT NULL CHECK (losses >= 0),
  final_rank INTEGER,
  rewards_claimed BOOLEAN DEFAULT false NOT NULL,
  UNIQUE(user_id, season_id)
);

-- 4. Create ranked matches table
CREATE TABLE IF NOT EXISTS ranked_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  winner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player1_rating_before INTEGER NOT NULL CHECK (player1_rating_before >= 400 AND player1_rating_before <= 3000),
  player2_rating_before INTEGER NOT NULL CHECK (player2_rating_before >= 400 AND player2_rating_before <= 3000),
  player1_rating_after INTEGER NOT NULL CHECK (player1_rating_after >= 400 AND player1_rating_after <= 3000),
  player2_rating_after INTEGER NOT NULL CHECK (player2_rating_after >= 400 AND player2_rating_after <= 3000),
  rating_change INTEGER NOT NULL,
  match_duration INTEGER NOT NULL CHECK (match_duration > 0), -- seconds
  rounds_played INTEGER NOT NULL CHECK (rounds_played > 0),
  player1_rounds_won INTEGER NOT NULL CHECK (player1_rounds_won >= 0),
  player2_rounds_won INTEGER NOT NULL CHECK (player2_rounds_won >= 0),
  season_id INTEGER REFERENCES seasons(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_winner CHECK (winner_id IN (player1_id, player2_id)),
  CONSTRAINT valid_rounds CHECK (player1_rounds_won + player2_rounds_won = rounds_played)
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_ratings_current_rating ON player_ratings(current_rating DESC);
CREATE INDEX IF NOT EXISTS idx_player_ratings_games_played ON player_ratings(games_played DESC);
CREATE INDEX IF NOT EXISTS idx_ranked_matches_player1 ON ranked_matches(player1_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ranked_matches_player2 ON ranked_matches(player2_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ranked_matches_created ON ranked_matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seasonal_ratings_season ON seasonal_ratings(season_id, current_rating DESC);

-- 6. Create updated_at trigger for player_ratings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_player_ratings_updated_at ON player_ratings;
CREATE TRIGGER update_player_ratings_updated_at
  BEFORE UPDATE ON player_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Enable RLS
ALTER TABLE player_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranked_matches ENABLE ROW LEVEL SECURITY;

-- 8. RLS policies for player_ratings
DROP POLICY IF EXISTS "Users can view all ratings" ON player_ratings;
CREATE POLICY "Users can view all ratings" ON player_ratings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can manage ratings" ON player_ratings;
CREATE POLICY "System can manage ratings" ON player_ratings
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 9. RLS policies for seasons
DROP POLICY IF EXISTS "Anyone can view seasons" ON seasons;
CREATE POLICY "Anyone can view seasons" ON seasons
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can manage seasons" ON seasons;
CREATE POLICY "System can manage seasons" ON seasons
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 10. RLS policies for seasonal_ratings
DROP POLICY IF EXISTS "Users can view all seasonal ratings" ON seasonal_ratings;
CREATE POLICY "Users can view all seasonal ratings" ON seasonal_ratings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can manage seasonal ratings" ON seasonal_ratings;
CREATE POLICY "System can manage seasonal ratings" ON seasonal_ratings
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 11. RLS policies for ranked_matches
DROP POLICY IF EXISTS "Users can view all matches" ON ranked_matches;
CREATE POLICY "Users can view all matches" ON ranked_matches
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can create matches" ON ranked_matches;
CREATE POLICY "System can create matches" ON ranked_matches
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 12. Enhanced ranked_matches table for analytics
ALTER TABLE ranked_matches ADD COLUMN IF NOT EXISTS game_mode VARCHAR(50) DEFAULT 'classic';
ALTER TABLE ranked_matches ADD COLUMN IF NOT EXISTS disconnect_penalty BOOLEAN DEFAULT false;
ALTER TABLE ranked_matches ADD COLUMN IF NOT EXISTS player1_solve_time_avg INTEGER;
ALTER TABLE ranked_matches ADD COLUMN IF NOT EXISTS player2_solve_time_avg INTEGER;
ALTER TABLE ranked_matches ADD COLUMN IF NOT EXISTS total_cards_used INTEGER;

-- 13. Create match_rounds table for detailed tracking
CREATE TABLE IF NOT EXISTS match_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES ranked_matches(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL CHECK (round_number > 0),
  winner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  player1_solve_time INTEGER, -- milliseconds, NULL if didn't solve
  player2_solve_time INTEGER, -- milliseconds, NULL if didn't solve
  cards_used JSONB NOT NULL, -- Array of card values used in this round
  solution_expression TEXT, -- The winning solution expression
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(match_id, round_number)
);

-- 14. Create player_performance_stats table
CREATE TABLE IF NOT EXISTS player_performance_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_solve_time BIGINT DEFAULT 0, -- Total milliseconds spent solving
  fastest_solve_time INTEGER, -- Fastest solve in milliseconds
  average_solve_time INTEGER, -- Average solve time
  total_rounds_played INTEGER DEFAULT 0,
  total_rounds_won INTEGER DEFAULT 0,
  longest_win_streak INTEGER DEFAULT 0,
  current_win_streak INTEGER DEFAULT 0,
  favorite_game_mode VARCHAR(50),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Add indexes for match analytics
CREATE INDEX IF NOT EXISTS idx_match_rounds_match_id ON match_rounds(match_id);
CREATE INDEX IF NOT EXISTS idx_match_rounds_winner ON match_rounds(winner_id);
CREATE INDEX IF NOT EXISTS idx_player_performance_user ON player_performance_stats(user_id);

-- 16. Create function to update player performance stats
CREATE OR REPLACE FUNCTION update_player_performance_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_avg_solve_time INTEGER;
  v_total_time BIGINT;
  v_win_streak INTEGER;
BEGIN
  -- Calculate stats for the winner
  IF NEW.winner_id IS NOT NULL THEN
    -- Get current stats
    SELECT 
      COALESCE(total_solve_time, 0) + COALESCE(NEW.player1_solve_time, NEW.player2_solve_time, 0),
      COALESCE(total_rounds_won, 0) + 1,
      COALESCE(current_win_streak, 0) + 1
    INTO v_total_time, v_total_time, v_win_streak
    FROM player_performance_stats
    WHERE user_id = NEW.winner_id;

    -- Calculate average
    v_avg_solve_time := v_total_time / GREATEST(v_total_time, 1);

    -- Upsert performance stats
    INSERT INTO player_performance_stats (
      user_id, 
      total_solve_time,
      fastest_solve_time,
      average_solve_time,
      total_rounds_played,
      total_rounds_won,
      current_win_streak,
      longest_win_streak,
      last_updated
    )
    VALUES (
      NEW.winner_id,
      v_total_time,
      LEAST(COALESCE(NEW.player1_solve_time, NEW.player2_solve_time), 999999),
      v_avg_solve_time,
      1,
      1,
      1,
      1,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      total_solve_time = player_performance_stats.total_solve_time + COALESCE(NEW.player1_solve_time, NEW.player2_solve_time, 0),
      fastest_solve_time = LEAST(player_performance_stats.fastest_solve_time, COALESCE(NEW.player1_solve_time, NEW.player2_solve_time, 999999)),
      average_solve_time = (player_performance_stats.total_solve_time + COALESCE(NEW.player1_solve_time, NEW.player2_solve_time, 0)) / (player_performance_stats.total_rounds_won + 1),
      total_rounds_played = player_performance_stats.total_rounds_played + 1,
      total_rounds_won = player_performance_stats.total_rounds_won + 1,
      current_win_streak = player_performance_stats.current_win_streak + 1,
      longest_win_streak = GREATEST(player_performance_stats.longest_win_streak, player_performance_stats.current_win_streak + 1),
      last_updated = NOW();
  END IF;

  -- Update loser's streak
  -- (Implementation would go here for the loser)

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 17. Create trigger for performance stats
DROP TRIGGER IF EXISTS update_performance_on_round ON match_rounds;
CREATE TRIGGER update_performance_on_round
  AFTER INSERT ON match_rounds
  FOR EACH ROW
  EXECUTE FUNCTION update_player_performance_stats();

-- 18. Enable RLS for new tables
ALTER TABLE match_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_performance_stats ENABLE ROW LEVEL SECURITY;

-- 19. RLS policies for match_rounds
DROP POLICY IF EXISTS "Users can view all match rounds" ON match_rounds;
CREATE POLICY "Users can view all match rounds" ON match_rounds
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can manage match rounds" ON match_rounds;
CREATE POLICY "System can manage match rounds" ON match_rounds
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 20. RLS policies for player_performance_stats
DROP POLICY IF EXISTS "Users can view all performance stats" ON player_performance_stats;
CREATE POLICY "Users can view all performance stats" ON player_performance_stats
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can manage performance stats" ON player_performance_stats;
CREATE POLICY "System can manage performance stats" ON player_performance_stats
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 21. Create match_replays table
CREATE TABLE IF NOT EXISTS match_replays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES ranked_matches(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  game_state JSONB NOT NULL, -- Complete game state snapshot
  player1_solution JSONB, -- Solution steps if player solved
  player2_solution JSONB, -- Solution steps if player solved
  round_duration INTEGER NOT NULL, -- milliseconds
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(match_id, round_number)
);

-- 22. Add replay metadata to ranked_matches
ALTER TABLE ranked_matches ADD COLUMN IF NOT EXISTS has_replay BOOLEAN DEFAULT false;
ALTER TABLE ranked_matches ADD COLUMN IF NOT EXISTS replay_version INTEGER DEFAULT 1;

-- 23. Create indexes for replay system
CREATE INDEX IF NOT EXISTS idx_match_replays_match_id ON match_replays(match_id);
CREATE INDEX IF NOT EXISTS idx_ranked_matches_has_replay ON ranked_matches(has_replay) WHERE has_replay = true;

-- 24. Enable RLS for replay table
ALTER TABLE match_replays ENABLE ROW LEVEL SECURITY;

-- 25. RLS policies for match_replays
DROP POLICY IF EXISTS "Users can view all replays" ON match_replays;
CREATE POLICY "Users can view all replays" ON match_replays
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can manage replays" ON match_replays;
CREATE POLICY "System can manage replays" ON match_replays
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 26. Function to mark match as having replay
CREATE OR REPLACE FUNCTION mark_match_has_replay()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ranked_matches 
  SET has_replay = true 
  WHERE id = NEW.match_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 27. Trigger to update replay status
DROP TRIGGER IF EXISTS update_match_replay_status ON match_replays;
CREATE TRIGGER update_match_replay_status
  AFTER INSERT ON match_replays
  FOR EACH ROW
  EXECUTE FUNCTION mark_match_has_replay();

-- Done! All ELO ranking system tables created.
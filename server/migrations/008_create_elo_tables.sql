-- Create player ratings table
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

-- Create seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT false NOT NULL,
  CONSTRAINT valid_season_dates CHECK (end_date > start_date)
);

-- Create seasonal ratings table
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

-- Create ranked matches table
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

-- Create indexes for performance
CREATE INDEX idx_player_ratings_current_rating ON player_ratings(current_rating DESC);
CREATE INDEX idx_player_ratings_games_played ON player_ratings(games_played DESC);
CREATE INDEX idx_ranked_matches_player1 ON ranked_matches(player1_id, created_at DESC);
CREATE INDEX idx_ranked_matches_player2 ON ranked_matches(player2_id, created_at DESC);
CREATE INDEX idx_ranked_matches_created ON ranked_matches(created_at DESC);
CREATE INDEX idx_seasonal_ratings_season ON seasonal_ratings(season_id, current_rating DESC);

-- Create updated_at trigger for player_ratings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_player_ratings_updated_at
  BEFORE UPDATE ON player_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE player_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranked_matches ENABLE ROW LEVEL SECURITY;

-- RLS policies for player_ratings
CREATE POLICY "Users can view all ratings" ON player_ratings
  FOR SELECT USING (true);

CREATE POLICY "System can manage ratings" ON player_ratings
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS policies for seasons
CREATE POLICY "Anyone can view seasons" ON seasons
  FOR SELECT USING (true);

CREATE POLICY "System can manage seasons" ON seasons
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS policies for seasonal_ratings
CREATE POLICY "Users can view all seasonal ratings" ON seasonal_ratings
  FOR SELECT USING (true);

CREATE POLICY "System can manage seasonal ratings" ON seasonal_ratings
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS policies for ranked_matches
CREATE POLICY "Users can view all matches" ON ranked_matches
  FOR SELECT USING (true);

CREATE POLICY "System can create matches" ON ranked_matches
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
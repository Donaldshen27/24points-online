-- Temporary fix for ELO foreign key constraints
-- This removes the foreign key constraints that are preventing ranked play
-- WARNING: This is a temporary solution. Implement proper auth before production!

-- Drop all foreign key constraints on player_ratings
ALTER TABLE player_ratings DROP CONSTRAINT IF EXISTS player_ratings_user_id_fkey;

-- Drop all foreign key constraints on seasonal_ratings  
ALTER TABLE seasonal_ratings DROP CONSTRAINT IF EXISTS seasonal_ratings_user_id_fkey;

-- Drop all foreign key constraints on ranked_matches
ALTER TABLE ranked_matches DROP CONSTRAINT IF EXISTS ranked_matches_player1_id_fkey;
ALTER TABLE ranked_matches DROP CONSTRAINT IF EXISTS ranked_matches_player2_id_fkey;
ALTER TABLE ranked_matches DROP CONSTRAINT IF EXISTS ranked_matches_winner_id_fkey;

-- Also need to handle match_rounds table if it exists
ALTER TABLE match_rounds DROP CONSTRAINT IF EXISTS match_rounds_match_id_fkey;
ALTER TABLE match_rounds DROP CONSTRAINT IF EXISTS match_rounds_winner_id_fkey;

-- Re-add the match_rounds foreign key to ranked_matches (this one is safe)
ALTER TABLE match_rounds 
  ADD CONSTRAINT match_rounds_match_id_fkey 
  FOREIGN KEY (match_id) REFERENCES ranked_matches(id) ON DELETE CASCADE;

-- Also fix the player_performance_stats table
ALTER TABLE player_performance_stats DROP CONSTRAINT IF EXISTS player_performance_stats_user_id_fkey;

-- And match_replays table
ALTER TABLE match_replays DROP CONSTRAINT IF EXISTS match_replays_match_id_fkey;

-- Re-add the safe foreign key
ALTER TABLE match_replays 
  ADD CONSTRAINT match_replays_match_id_fkey 
  FOREIGN KEY (match_id) REFERENCES ranked_matches(id) ON DELETE CASCADE;

-- Add NOT NULL constraints to ensure data integrity
ALTER TABLE player_ratings ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE seasonal_ratings ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE ranked_matches ALTER COLUMN player1_id SET NOT NULL;
ALTER TABLE ranked_matches ALTER COLUMN player2_id SET NOT NULL;
ALTER TABLE ranked_matches ALTER COLUMN winner_id SET NOT NULL;

-- Note: This allows any UUID to be used as a user_id
-- The application should validate that users exist before creating ratings
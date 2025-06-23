-- Long-term fix: Update ELO tables to use custom users table instead of auth.users
-- This maintains data integrity while working with the app's existing user system

-- Step 1: Drop existing foreign key constraints that reference auth.users
ALTER TABLE player_ratings DROP CONSTRAINT IF EXISTS player_ratings_user_id_fkey;
ALTER TABLE seasonal_ratings DROP CONSTRAINT IF EXISTS seasonal_ratings_user_id_fkey;
ALTER TABLE ranked_matches DROP CONSTRAINT IF EXISTS ranked_matches_player1_id_fkey;
ALTER TABLE ranked_matches DROP CONSTRAINT IF EXISTS ranked_matches_player2_id_fkey;
ALTER TABLE ranked_matches DROP CONSTRAINT IF EXISTS ranked_matches_winner_id_fkey;
ALTER TABLE match_rounds DROP CONSTRAINT IF EXISTS match_rounds_winner_id_fkey;
ALTER TABLE player_performance_stats DROP CONSTRAINT IF EXISTS player_performance_stats_user_id_fkey;

-- Step 2: Add foreign key constraints to the custom users table
ALTER TABLE player_ratings 
  ADD CONSTRAINT player_ratings_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE seasonal_ratings 
  ADD CONSTRAINT seasonal_ratings_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE ranked_matches 
  ADD CONSTRAINT ranked_matches_player1_id_fkey 
  FOREIGN KEY (player1_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE ranked_matches 
  ADD CONSTRAINT ranked_matches_player2_id_fkey 
  FOREIGN KEY (player2_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE ranked_matches 
  ADD CONSTRAINT ranked_matches_winner_id_fkey 
  FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE match_rounds 
  ADD CONSTRAINT match_rounds_winner_id_fkey 
  FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE player_performance_stats 
  ADD CONSTRAINT player_performance_stats_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 3: Also update user_badges table to use custom users table
ALTER TABLE user_badges DROP CONSTRAINT IF EXISTS user_badges_user_id_fkey;
ALTER TABLE user_badges 
  ADD CONSTRAINT user_badges_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 4: Update badge_progress table
ALTER TABLE badge_progress DROP CONSTRAINT IF EXISTS badge_progress_user_id_fkey;
ALTER TABLE badge_progress 
  ADD CONSTRAINT badge_progress_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 5: Update user_statistics table
ALTER TABLE user_statistics DROP CONSTRAINT IF EXISTS user_statistics_user_id_fkey;
ALTER TABLE user_statistics 
  ADD CONSTRAINT user_statistics_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Note: This assumes that all user IDs in the system exist in the users table
-- If there are orphaned records, you may need to clean them up first
-- Fix foreign key constraints for ELO tables
-- The issue: ELO tables reference auth.users but the app uses a custom users table

-- First, we need to drop the existing foreign key constraints
ALTER TABLE player_ratings DROP CONSTRAINT IF EXISTS player_ratings_user_id_fkey;
ALTER TABLE seasonal_ratings DROP CONSTRAINT IF EXISTS seasonal_ratings_user_id_fkey;
ALTER TABLE ranked_matches DROP CONSTRAINT IF EXISTS ranked_matches_player1_id_fkey;
ALTER TABLE ranked_matches DROP CONSTRAINT IF EXISTS ranked_matches_player2_id_fkey;
ALTER TABLE ranked_matches DROP CONSTRAINT IF EXISTS ranked_matches_winner_id_fkey;

-- Option 1: If you're using Supabase Auth (recommended)
-- This creates users in auth.users when they sign up
-- No changes needed, but you need to ensure users are properly authenticated

-- Option 2: If you're using custom auth with the users table
-- Uncomment the following lines to use your custom users table:

/*
-- Add foreign key constraints to the custom users table
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
*/

-- Option 3: Remove foreign key constraints entirely (NOT RECOMMENDED)
-- This allows any UUID to be used, which can lead to data integrity issues
-- Only use this for testing or if you have a different auth system

-- Temporary solution: Create the user in auth.users if it doesn't exist
-- This is a workaround for the current issue
-- Note: This requires appropriate permissions and may not work in all Supabase setups

-- For now, let's remove the foreign key constraints to allow the game to work
-- You should implement proper authentication before production

ALTER TABLE player_ratings 
  ADD CONSTRAINT player_ratings_user_id_check 
  CHECK (user_id IS NOT NULL);

-- The proper solution is to:
-- 1. Use Supabase Auth for user registration/login
-- 2. Ensure all players have auth.users entries
-- 3. Or switch all foreign keys to use your custom users table
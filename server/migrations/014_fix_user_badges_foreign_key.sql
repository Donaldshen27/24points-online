-- Fix user_badges foreign key constraint issue
-- The problem: user_badges.user_id is VARCHAR but users.id is UUID

-- First, drop the incorrect constraint attempts
ALTER TABLE user_badges DROP CONSTRAINT IF EXISTS user_badges_user_id_fkey;
ALTER TABLE user_badges DROP CONSTRAINT IF EXISTS user_badges_auth_user_fkey;

ALTER TABLE user_statistics DROP CONSTRAINT IF EXISTS user_statistics_user_id_fkey;
ALTER TABLE user_statistics DROP CONSTRAINT IF EXISTS user_statistics_auth_user_fkey;

ALTER TABLE badge_progress DROP CONSTRAINT IF EXISTS badge_progress_user_id_fkey;
ALTER TABLE badge_progress DROP CONSTRAINT IF EXISTS badge_progress_auth_user_fkey;

-- Since user_id is VARCHAR and can contain both UUIDs (as text) and guest IDs,
-- we cannot create a direct foreign key to users.id (UUID type)
-- 
-- The badge system already handles this by using VARCHAR for user_id
-- to support both authenticated users (UUID as string) and guests (arbitrary strings)

-- We'll add a CHECK constraint instead to ensure data integrity
ALTER TABLE user_badges ADD CONSTRAINT user_badges_user_id_not_empty 
  CHECK (user_id IS NOT NULL AND user_id != '');

ALTER TABLE user_statistics ADD CONSTRAINT user_statistics_user_id_not_empty 
  CHECK (user_id IS NOT NULL AND user_id != '');

ALTER TABLE badge_progress ADD CONSTRAINT badge_progress_user_id_not_empty 
  CHECK (user_id IS NOT NULL AND user_id != '');

-- For the ELO tables, we need to ensure they also support VARCHAR user_ids
-- or we keep them UUID-only for authenticated users only

-- Option 1: Keep ELO tables UUID-only (recommended for ranked play)
-- This means only authenticated users can play ranked
-- No changes needed, foreign keys work as intended

-- Option 2: Convert ELO tables to VARCHAR to support guests
-- Uncomment below if you want guests to play ranked (not recommended)

/*
-- Convert player_ratings user_id to VARCHAR
ALTER TABLE player_ratings DROP CONSTRAINT IF EXISTS player_ratings_user_id_fkey;
ALTER TABLE player_ratings 
  ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::text;

-- Convert seasonal_ratings user_id to VARCHAR  
ALTER TABLE seasonal_ratings DROP CONSTRAINT IF EXISTS seasonal_ratings_user_id_fkey;
ALTER TABLE seasonal_ratings 
  ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::text;

-- Convert ranked_matches player IDs to VARCHAR
ALTER TABLE ranked_matches 
  DROP CONSTRAINT IF EXISTS ranked_matches_player1_id_fkey,
  DROP CONSTRAINT IF EXISTS ranked_matches_player2_id_fkey,
  DROP CONSTRAINT IF EXISTS ranked_matches_winner_id_fkey;

ALTER TABLE ranked_matches 
  ALTER COLUMN player1_id TYPE VARCHAR(255) USING player1_id::text,
  ALTER COLUMN player2_id TYPE VARCHAR(255) USING player2_id::text,
  ALTER COLUMN winner_id TYPE VARCHAR(255) USING winner_id::text;

-- Similar for other ELO-related tables...
*/

-- The proper solution is to keep ranked play for authenticated users only
-- Guest users can earn badges but cannot play ranked
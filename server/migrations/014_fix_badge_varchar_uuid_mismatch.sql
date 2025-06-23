-- Fix the type mismatch between badge tables (VARCHAR) and users table (UUID)
-- This is a simpler fix that removes the problematic constraints

-- Remove the foreign key constraints that were attempted in migration 013
-- These fail because user_badges.user_id is VARCHAR but users.id is UUID

ALTER TABLE user_badges DROP CONSTRAINT IF EXISTS user_badges_user_id_fkey;
ALTER TABLE badge_progress DROP CONSTRAINT IF EXISTS badge_progress_user_id_fkey;
ALTER TABLE user_statistics DROP CONSTRAINT IF EXISTS user_statistics_user_id_fkey;

-- The badge system was designed to support both:
-- 1. Authenticated users with UUID IDs
-- 2. Guest users with string IDs like "guest-xyz"
-- 
-- Therefore, badge tables use VARCHAR for user_id and cannot have
-- foreign keys to the users table (which uses UUID)

-- For data integrity, we use CHECK constraints instead
ALTER TABLE user_badges DROP CONSTRAINT IF EXISTS user_badges_user_id_not_empty;
ALTER TABLE user_badges ADD CONSTRAINT user_badges_user_id_not_empty 
  CHECK (user_id IS NOT NULL AND length(user_id) > 0);

ALTER TABLE user_statistics DROP CONSTRAINT IF EXISTS user_statistics_user_id_not_empty;
ALTER TABLE user_statistics ADD CONSTRAINT user_statistics_user_id_not_empty 
  CHECK (user_id IS NOT NULL AND length(user_id) > 0);

ALTER TABLE badge_progress DROP CONSTRAINT IF EXISTS badge_progress_user_id_not_empty;
ALTER TABLE badge_progress ADD CONSTRAINT badge_progress_user_id_not_empty 
  CHECK (user_id IS NOT NULL AND length(user_id) > 0);

-- Note: ELO tables (player_ratings, ranked_matches, etc.) remain UUID-only
-- because ranked play requires authenticated users
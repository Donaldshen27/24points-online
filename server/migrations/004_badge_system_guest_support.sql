-- Update badge system to support both authenticated users (UUID) and guest users (string IDs)

-- First, we need to change the user_id columns from UUID to VARCHAR to support both types
-- This requires recreating the foreign key constraints

-- Drop existing foreign key constraints
ALTER TABLE user_statistics DROP CONSTRAINT IF EXISTS user_statistics_pkey;
ALTER TABLE user_badges DROP CONSTRAINT IF EXISTS user_badges_user_id_fkey;
ALTER TABLE badge_progress DROP CONSTRAINT IF EXISTS badge_progress_user_id_fkey;

-- Change user_id columns to VARCHAR
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
CREATE OR REPLACE FUNCTION is_authenticated_user(user_id_param VARCHAR(255))
RETURNS BOOLEAN AS $$
BEGIN
  -- Try to cast to UUID, return false if it fails
  PERFORM user_id_param::UUID;
  RETURN TRUE;
EXCEPTION
  WHEN invalid_text_representation THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX idx_user_statistics_user_type ON user_statistics(is_authenticated_user(user_id));
CREATE INDEX idx_user_badges_user_type ON user_badges(is_authenticated_user(user_id));
CREATE INDEX idx_badge_progress_user_type ON badge_progress(is_authenticated_user(user_id));

-- Update foreign key constraints to only apply for authenticated users
-- This allows guest users to have badges without being in the users table
ALTER TABLE user_badges
  ADD CONSTRAINT user_badges_auth_user_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id::text) 
  ON DELETE CASCADE
  WHERE is_authenticated_user(user_id);

ALTER TABLE user_statistics
  ADD CONSTRAINT user_statistics_auth_user_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id::text) 
  ON DELETE CASCADE
  WHERE is_authenticated_user(user_id);

ALTER TABLE badge_progress
  ADD CONSTRAINT badge_progress_auth_user_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id::text) 
  ON DELETE CASCADE
  WHERE is_authenticated_user(user_id);

-- Add a column to track whether stats belong to a guest or authenticated user
ALTER TABLE user_statistics
  ADD COLUMN is_guest BOOLEAN DEFAULT false;

-- Update existing data to mark non-UUID users as guests
UPDATE user_statistics
SET is_guest = NOT is_authenticated_user(user_id);

-- Create a function to clean up old guest statistics (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_guest_stats(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_statistics
  WHERE is_guest = true 
    AND updated_at < NOW() - INTERVAL '1 day' * days_old
    AND games_played < 5; -- Only delete if they played less than 5 games
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comment on the changes
COMMENT ON COLUMN user_statistics.is_guest IS 'True for guest users (non-UUID IDs), false for authenticated users';
COMMENT ON FUNCTION is_authenticated_user IS 'Checks if a user_id is a valid UUID (authenticated user)';
COMMENT ON FUNCTION cleanup_old_guest_stats IS 'Removes old guest statistics to prevent table bloat';
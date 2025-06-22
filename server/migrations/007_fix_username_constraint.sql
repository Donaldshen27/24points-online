-- Fix username constraint to allow 2-character usernames

-- Drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS username_format;

-- Add new constraint that allows 2-50 character usernames
ALTER TABLE users ADD CONSTRAINT username_format 
  CHECK (username ~* '^[a-zA-Z0-9_-]{2,50}$');

-- Update the comment
COMMENT ON CONSTRAINT username_format ON users IS 'Username must be 2-50 characters, alphanumeric with underscores and hyphens';

-- Notify about the change
DO $$
BEGIN
  RAISE NOTICE 'Username constraint updated to allow 2-character usernames';
END $$;
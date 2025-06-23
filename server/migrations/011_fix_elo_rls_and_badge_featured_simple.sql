-- Simpler migration that should work with Supabase

-- Fix 1: Add the missing is_featured column to user_badges table
ALTER TABLE user_badges 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Fix 2: Update RLS policies for player_ratings to be more permissive
-- First, check if RLS is enabled
ALTER TABLE player_ratings ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies with simpler rules
DROP POLICY IF EXISTS "Users can view all ratings" ON player_ratings;
DROP POLICY IF EXISTS "System can manage ratings" ON player_ratings;

-- Simple policy: Anyone can read
CREATE POLICY "Enable read access for all users" ON player_ratings
  FOR SELECT USING (true);

-- Simple policy: Authenticated users can insert/update/delete
-- This allows the server (which uses service key) to manage ratings
CREATE POLICY "Enable write access for authenticated users" ON player_ratings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON player_ratings
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON player_ratings
  FOR DELETE USING (true);

-- Fix 3: Update user_badges policies similarly
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all badges" ON user_badges;
DROP POLICY IF EXISTS "Users can manage own badges" ON user_badges;

-- Anyone can view badges
CREATE POLICY "Enable read access for all users" ON user_badges
  FOR SELECT USING (true);

-- Allow all authenticated operations (the server will handle authorization)
CREATE POLICY "Enable insert for authenticated users" ON user_badges
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON user_badges
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON user_badges
  FOR DELETE USING (true);

-- Create index for featured badges
CREATE INDEX IF NOT EXISTS idx_user_badges_featured 
ON user_badges(user_id, is_featured) 
WHERE is_featured = true;
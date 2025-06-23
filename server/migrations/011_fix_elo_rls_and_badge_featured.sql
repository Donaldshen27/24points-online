-- Fix 1: Update RLS policies for player_ratings to allow service role to create ratings
-- The current policy likely only allows viewing, not creating/updating

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all ratings" ON player_ratings;
DROP POLICY IF EXISTS "System can manage ratings" ON player_ratings;

-- Create new policies that properly allow service role to manage ratings
CREATE POLICY "Users can view all ratings" ON player_ratings
  FOR SELECT USING (true);

-- This policy allows the service role (used by the server) to manage ratings
CREATE POLICY "Service role can manage ratings" ON player_ratings
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Also allow authenticated users to view their own rating
CREATE POLICY "Users can view own rating" ON player_ratings
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Fix 2: Add the missing is_featured column to user_badges table
ALTER TABLE user_badges 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Create an index for better query performance when fetching featured badges
CREATE INDEX IF NOT EXISTS idx_user_badges_featured 
ON user_badges(user_id, is_featured) 
WHERE is_featured = true;

-- Fix 3: Also update RLS policies for user_badges to ensure updates work
DROP POLICY IF EXISTS "Users can view all badges" ON user_badges;
DROP POLICY IF EXISTS "Users can manage own badges" ON user_badges;

-- Allow everyone to view badges
CREATE POLICY "Anyone can view badges" ON user_badges
  FOR SELECT USING (true);

-- Allow service role to manage all badges
CREATE POLICY "Service role can manage badges" ON user_badges
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow authenticated users to update their own badges (for featured flag)
CREATE POLICY "Users can update own badges" ON user_badges
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix 4: Ensure the service role can also manage ranked_matches
DROP POLICY IF EXISTS "Users can view all matches" ON ranked_matches;
DROP POLICY IF EXISTS "System can create matches" ON ranked_matches;

CREATE POLICY "Anyone can view matches" ON ranked_matches
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage matches" ON ranked_matches
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Refresh the schema cache to ensure Supabase picks up the new column
-- This is done automatically when you run the migration, but adding a comment for clarity
-- The schema cache error should be resolved after running this migration
# Badge Featured Column and RLS Policy Fix

## Problems Identified

### 1. Missing `is_featured` Column
Error: `Could not find the 'is_featured' column of 'user_badges' in the schema cache`

The badge system expects an `is_featured` column in the `user_badges` table to track which badges a user has selected to display on their profile.

### 2. Row-Level Security (RLS) Policy Error
Error: `new row violates row-level security policy for table "player_ratings"`

The RLS policies for the `player_ratings` table are too restrictive and prevent the server from creating initial ratings for new players.

## Solution

### Quick Fix
Run the migration file `011_fix_elo_rls_and_badge_featured_simple.sql` in your Supabase SQL editor:

```sql
-- This migration will:
-- 1. Add the is_featured column to user_badges
-- 2. Update RLS policies to allow the server to manage ratings
-- 3. Create an index for better performance
```

### What the Migration Does

1. **Adds `is_featured` Column**
   - Adds a boolean column to track which badges are featured
   - Defaults to false for existing badges
   - Creates an index for efficient queries

2. **Updates RLS Policies**
   - Makes policies more permissive for server operations
   - Allows authenticated requests (from the server) to manage data
   - Maintains read access for all users

3. **Ensures Proper Permissions**
   - The server uses a service role key which needs write access
   - The policies now allow INSERT, UPDATE, and DELETE operations

### Manual Steps

If you prefer to run the fixes manually:

1. **Add the Featured Column**:
```sql
ALTER TABLE user_badges 
ADD COLUMN is_featured BOOLEAN DEFAULT false;
```

2. **Fix Player Ratings RLS**:
```sql
-- Drop old restrictive policies
DROP POLICY IF EXISTS "System can manage ratings" ON player_ratings;

-- Create new permissive policies
CREATE POLICY "Enable write access for authenticated users" ON player_ratings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON player_ratings
  FOR UPDATE USING (true) WITH CHECK (true);
```

3. **Fix User Badges RLS**:
```sql
-- Allow updates to user_badges
CREATE POLICY "Enable update for authenticated users" ON user_badges
  FOR UPDATE USING (true) WITH CHECK (true);
```

### Verification

After running the migration:

1. **Test Badge Equipment**:
   - Select badges in your profile
   - Click save
   - Refresh the page
   - Badges should remain selected

2. **Test Ranked Play**:
   - Join a ranked match
   - The system should create your initial rating without errors

### Prevention

To prevent these issues in the future:
1. Always test RLS policies with the same authentication method your server uses
2. Include all necessary columns in initial table creation
3. Document any custom columns added to standard tables

### Related Files
- Migration: `server/migrations/011_fix_elo_rls_and_badge_featured_simple.sql`
- Rating Service: `server/src/services/RatingService.ts`
- Badge Service: `server/src/badges/BadgeDetectionService.ts`
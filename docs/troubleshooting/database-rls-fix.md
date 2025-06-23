# Database RLS and Replay Function Fix

## Issue Description

Two database issues were identified in the production environment:

1. **RLS Policy Error**: "new row violates row-level security policy for table ranked_matches"
   - The service role was unable to insert new ranked match records
   - Existing RLS policies were too restrictive

2. **Missing Function**: save_round_replay function was returning "function does not exist"
   - The function was defined in migration 010 but referenced auth.users
   - Migration 015 updated it to use custom users table but may not have run

## Root Cause Analysis

### RLS Policy Issue
The original RLS policies in migration 008 used `auth.uid() IS NOT NULL` which doesn't properly identify the service role. The service role needs explicit permissions using the `TO service_role` clause.

### Missing Function Issue
The save_round_replay function was created in migration 010 but later updated in migration 015. If migration 015 failed or didn't run completely, the function might be missing or still reference the wrong user table.

## Solution

Created migration 018_fix_rls_and_replay_function.sql that:

### 1. Fixes RLS Policies
- Drops all existing policies on ranked_matches, match_replays, player_ratings, and seasonal_ratings
- Creates new policies that explicitly grant full access to service_role using:
  ```sql
  CREATE POLICY "Service role has full access" ON table_name
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);
  ```
- Maintains read access for anonymous and authenticated users

### 2. Recreates save_round_replay Function
- Drops the existing function if it exists
- Recreates it with proper parameters and SECURITY DEFINER
- Ensures it references the correct user table (users instead of auth.users)
- Grants EXECUTE permission to service_role

### 3. Ensures All Required Columns Exist
- Adds any missing columns to ranked_matches table:
  - game_mode, disconnect_forfeit
  - player1/2_solve_times, player1/2_first_solves
  - player1/2_avg_solve_time_ms
  - replay_data, match_statistics

### 4. Updates Foreign Key Constraints
- Updates match_replays.solver_id to reference users table instead of auth.users

## How to Apply

1. Connect to your Supabase database
2. Run the migration:
   ```sql
   -- Run the contents of server/migrations/018_fix_rls_and_replay_function.sql
   ```

3. Verify the fix:
   ```sql
   -- Check RLS policies
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
   FROM pg_policies 
   WHERE tablename IN ('ranked_matches', 'match_replays', 'player_ratings');

   -- Check function exists
   SELECT proname, prosrc 
   FROM pg_proc 
   WHERE proname = 'save_round_replay';
   ```

## Prevention

To prevent similar issues in the future:

1. **Always use explicit role specifications in RLS policies**
   - Use `TO service_role` instead of relying on auth.uid() checks
   - Test policies with different authentication contexts

2. **Ensure migrations run in order**
   - Check migration logs for errors
   - Verify each migration completes successfully

3. **Use SECURITY DEFINER for service functions**
   - Functions that need elevated permissions should use SECURITY DEFINER
   - This ensures they run with the definer's permissions, not the caller's

## Testing

After applying the migration, test:

1. **Ranked match creation**: Create a new ranked match and verify it saves
2. **Replay saving**: Save a round replay and verify the function executes
3. **Leaderboard queries**: Verify that leaderboard queries still work
4. **Match history**: Check that match history retrieval works properly
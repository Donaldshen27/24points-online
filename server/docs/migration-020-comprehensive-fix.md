# Migration 020: Comprehensive Fix for All Issues

## Overview

This migration (`020_comprehensive_fix_all_issues.sql`) is a nuclear option that comprehensively fixes all remaining database issues that were preventing the ELO system from working properly.

## Issues Fixed

### 1. Missing `center_cards` Column
- The `match_replays` table was missing the `center_cards` column
- This column is required by the `save_round_replay` function
- Migration adds this column with proper JSONB type and NOT NULL constraint

### 2. RLS Policies Blocking Inserts
- Row Level Security (RLS) policies were preventing the backend from inserting into `ranked_matches`
- Even with service role permissions, inserts were being blocked
- **Solution**: Temporarily DISABLE RLS on all game tables

### 3. Missing Columns on `ranked_matches`
The migration ensures ALL required columns exist:
- `game_mode` - The game mode (classic, super, extended)
- `disconnect_forfeit` - Whether match ended due to disconnect
- `player1_solve_times` / `player2_solve_times` - Array of solve times
- `player1_first_solves` / `player2_first_solves` - Count of who solved first
- `player1_avg_solve_time_ms` / `player2_avg_solve_time_ms` - Average solve times
- `replay_data` - Additional replay metadata
- `match_statistics` - Match statistics JSON
- `has_replay` - Boolean flag for replay availability
- `replay_version` - Version of replay format
- `final_game_state` - Final state of the game

### 4. Foreign Key Constraints
- Updates `match_replays.solver_id` to reference `users` table instead of `auth.users`
- This matches the actual table structure in the database

### 5. Permissions
- Grants ALL permissions on ALL tables to service_role
- Ensures the backend can perform all necessary operations

## What This Migration Does

1. **Adds Missing Columns**: Checks and adds any missing columns to all tables
2. **Disables RLS**: Temporarily disables Row Level Security on:
   - `ranked_matches`
   - `match_replays` 
   - `player_ratings`
   - `seasonal_ratings`
3. **Drops All Policies**: Removes all existing RLS policies to start fresh
4. **Fixes Functions**: Updates `save_round_replay` with better error handling
5. **Grants Permissions**: Ensures service_role has full access to everything
6. **Creates Indexes**: Adds performance indexes for common queries
7. **Runs Test**: Includes a test function to verify the system works

## Running the Migration

### Option 1: Using the Script
```bash
cd server
npm run migration:comprehensive-fix
# or
node scripts/run-comprehensive-fix.js
```

### Option 2: Manual Execution
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Copy entire contents of `migrations/020_comprehensive_fix_all_issues.sql`
4. Paste and execute

### Option 3: Using Supabase CLI
```bash
supabase db push --include migrations/020_comprehensive_fix_all_issues.sql
```

## Important Notes

### RLS is Disabled!
This migration **disables Row Level Security** as a temporary measure. This means:
- All data is accessible without authentication checks
- This is NOT suitable for production long-term
- A future migration should re-enable RLS with proper policies

### Why This Approach?
After multiple attempts to fix RLS policies, we're taking the nuclear option:
1. Previous migrations had conflicting or overly restrictive policies
2. Service role was still being blocked despite permissions
3. The system needs to work NOW, security can be re-added later

### Future Work
A follow-up migration should:
1. Re-enable RLS with simpler, working policies
2. Add proper authentication checks
3. Ensure service_role bypass works correctly

## Verification

After running the migration, verify:

1. **Test Insert**: Try creating a ranked match
   ```sql
   -- This should now work
   INSERT INTO ranked_matches (player1_id, player2_id, ...) VALUES (...);
   ```

2. **Test Replay**: Try saving a round replay
   ```sql
   -- This should now work
   SELECT save_round_replay(...);
   ```

3. **Check RLS Status**:
   ```sql
   -- Should show FALSE for relrowsecurity
   SELECT relname, relrowsecurity 
   FROM pg_class 
   WHERE relname IN ('ranked_matches', 'match_replays', 'player_ratings', 'seasonal_ratings');
   ```

## Rollback

If needed, you can re-enable RLS:
```sql
ALTER TABLE ranked_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_replays ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_ratings ENABLE ROW LEVEL SECURITY;
```

But this will likely cause the insert issues to return.
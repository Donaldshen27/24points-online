# ELO System Schema Fixes

## Issues Identified

1. **Missing function**: `save_round_replay` was referencing `auth.users` instead of the custom `users` table (fixed in migration 013)
2. **Column name mismatch**: TypeScript code uses camelCase (`createdAt`) but database uses snake_case (`created_at`)
3. **Missing columns**: 
   - `duration_seconds` (was using `match_duration`)
   - `player1_rating_change` and `player2_rating_change` (now generated columns)
   - `game_mode` was not being saved

## Solutions Implemented

### 1. Migration File (015_fix_elo_schema_issues.sql)

Created a new migration that:
- Adds missing columns to `ranked_matches` table
- Updates all functions to use custom `users` table instead of `auth.users`
- Creates generated columns for rating changes
- Renames `match_duration` to `duration_seconds` if needed
- Creates a view `ranked_matches_view` for camelCase compatibility

### 2. RatingService.ts Updates

- Added `toSnakeCase()` helper method to convert camelCase to snake_case
- Updated `saveMatch()` to:
  - Convert camelCase properties to snake_case
  - Handle special cases (matchDuration → duration_seconds)
  - Convert Date objects to ISO strings
  - Include gameMode in the match record

### 3. Type Definition Updates

- Added `gameMode` field to `RankedMatch` interface in shared/types/elo.ts

## How to Apply the Fixes

### Option 1: Run Migration in Supabase Dashboard

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `server/migrations/015_fix_elo_schema_issues.sql`
4. Click "Run" to execute the migration

### Option 2: Use the Migration Script

```bash
cd server
node scripts/run-elo-fix-migration.js
```

Note: The script will provide instructions since some SQL operations require direct database access.

## Testing the Fixes

After applying the migration:

1. Test creating a new ranked match
2. Verify that `save_round_replay` function works
3. Check that match history displays correctly
4. Ensure rating updates work properly

## Database Schema After Fixes

### ranked_matches table
```sql
- id (UUID)
- player1_id (UUID) → users.id
- player2_id (UUID) → users.id  
- winner_id (UUID) → users.id
- player1_rating_before (INTEGER)
- player2_rating_before (INTEGER)
- player1_rating_after (INTEGER)
- player2_rating_after (INTEGER)
- rating_change (INTEGER)
- duration_seconds (INTEGER) -- renamed from match_duration
- rounds_played (INTEGER)
- player1_rounds_won (INTEGER)
- player2_rounds_won (INTEGER)
- game_mode (VARCHAR(20))
- season_id (INTEGER)
- created_at (TIMESTAMPTZ)
- player1_rating_change (INTEGER) -- generated column
- player2_rating_change (INTEGER) -- generated column
... other analytics columns
```

### ranked_matches_view
Provides camelCase aliases for TypeScript compatibility:
- `created_at` → `createdAt`
- `player1_id` → `player1Id`
- etc.

## Code Changes Summary

1. **RatingService.ts**:
   - Added case conversion for database operations
   - Ensures gameMode is included in match records
   - Handles duration field naming properly

2. **Type Definitions**:
   - Added optional gameMode field to RankedMatch interface

3. **Database Functions**:
   - All functions now reference custom `users` table
   - Proper foreign key constraints maintained
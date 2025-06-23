# ELO Leaderboard Error Fix

## Problem
The leaderboard ELO section shows the error:
```
[RankedHandler] Error getting leaderboard: Error: Failed to get leaderboard: relation "public.player_ratings" does not exist
```

## Root Cause
The ELO ranking system database tables have not been created. The migrations for the ELO system were created but not executed in the Supabase database.

## Solution

### Quick Fix (Recommended)
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `server/migrations/elo_combined_migration.sql`
4. Execute the migration

This will create all required tables in one go:
- `player_ratings` - Main player rating tracking
- `seasons` - Seasonal system support
- `seasonal_ratings` - Season-specific ratings
- `ranked_matches` - Match history
- `match_rounds` - Round-by-round details
- `player_performance_stats` - Performance analytics
- `match_replays` - Replay data storage

### Alternative: Run Individual Migrations
If you prefer to run migrations step by step:
1. `server/migrations/008_create_elo_tables.sql` - Core ELO tables
2. `server/migrations/009_match_history_analytics.sql` - Analytics tables
3. `server/migrations/010_match_replay_system.sql` - Replay system

### Verification
After running the migrations, verify the setup:

```bash
cd server
node scripts/check-elo-migrations.js
```

This will show:
- Which tables exist
- Row counts for each table
- Any missing tables
- Active season status

### Post-Migration Setup
After creating the tables, you may want to:

1. **Create an Active Season** (optional):
```sql
INSERT INTO seasons (name, start_date, end_date, is_active)
VALUES ('Season 1', NOW(), NOW() + INTERVAL '3 months', true);
```

2. **Test the System**:
- Try accessing the leaderboard again
- Play a ranked match to verify rating updates
- Check that player profiles show ELO data

## Prevention
To prevent this in the future:
1. Always check migration status after deployment
2. Include migration checks in deployment scripts
3. Document required migrations in deployment guides

## Related Files
- Migration files: `server/migrations/`
- Migration checker: `server/scripts/check-elo-migrations.js`
- Rating service: `server/src/services/RatingService.ts`
- Database setup: `server/src/db/supabase.ts`
# Database Migrations

## Migration History

### Fixed Issues

**016_fix_elo_schema_safe.sql** - DISABLED
- This migration referenced non-existent tables (`elo_history`, `game_sessions`, `players`)
- The actual ELO system uses: `player_ratings`, `seasons`, `seasonal_ratings`, `ranked_matches`
- File has been renamed to `.disabled` to prevent execution

**017_fix_elo_schema_correct_tables.sql** - ACTIVE
- Correctly adds missing columns to `ranked_matches` table
- Adds `duration_seconds`, `player1_rating_change`, `player2_rating_change` columns
- Uses proper conditional checks to avoid errors if columns already exist

## Running Migrations

Migrations should be run directly in your Supabase dashboard or through the Supabase CLI.

The actual tables used by the ELO system are:
- `player_ratings` - Stores current player ratings and statistics
- `seasons` - Seasonal competition data
- `seasonal_ratings` - Player ratings per season
- `ranked_matches` - Match history with rating changes

## Important Notes

1. Always check table existence before creating migrations
2. Use conditional DDL statements (DO blocks) to make migrations idempotent
3. The server code in `src/services/RatingService.ts` uses the correct table names
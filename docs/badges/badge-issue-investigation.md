# Badge System Issue Investigation

## Problem Description
User receives "badges unlocked" notifications but badges don't appear in the database or frontend.

## Investigation Findings

### 1. Authentication & User ID
- ✅ User ID is correctly passed from Socket.io auth to game logic
- ✅ Authenticated users use their actual user ID (from JWT) for badge tracking
- ✅ Guest users get temporary IDs like `player-timestamp-random`

### 2. Badge Detection Flow
- ✅ `checkBadgesAfterGame()` is called after each game completion
- ✅ Badges are detected and notifications are sent via Socket.io
- ❓ Badge insertion to database may be failing

### 3. Database Schema
- The badge system requires specific tables that may not exist
- Tables needed: `badge_definitions`, `user_statistics`, `user_badges`, `badge_progress`, `badge_challenges`
- Schema supports both UUID (authenticated) and string (guest) user IDs

### 4. Issues Found
1. **Column name mismatch**: Route was looking for `unlocked_at` instead of `earned_at` (FIXED)
2. **Missing database tables**: Badge tables might not be created in Supabase
3. **No error visibility**: Badge insertion errors weren't clearly logged

## Solutions Implemented

### 1. Enhanced Logging
- Added detailed logging to `awardBadge()` method
- Added table existence check before insertion
- Added logging to frontend badge service

### 2. Fixed Column Name
- Changed `unlocked_at` to `earned_at` in badge route

### 3. Created Migration Tools
- `check-badge-tables.sql` - SQL script to verify table existence
- `run-badge-migrations.js` - Node script to check migration status

## Next Steps

### For the User:
1. **Check if badge tables exist in Supabase:**
   ```bash
   cd server
   node scripts/run-badge-migrations.js
   ```

2. **If tables are missing, run migrations in order:**
   - Go to Supabase SQL editor
   - Run migrations from `server/migrations/` in this order:
     1. `002_badge_system.sql`
     2. `003_badge_definitions_seed.sql`
     3. `004_badge_system_guest_support.sql`
     4. `005_badge_leaderboard_function.sql`

3. **Verify with SQL:**
   - Run `server/scripts/check-badge-tables.sql` in Supabase SQL editor

### Debug Information to Check:
1. Server logs should show:
   - `[BadgeDetection] Attempting to award badge...`
   - Either success or specific error messages

2. Client console should show:
   - `[BadgeService] Fetching user badges...`
   - Response data or error details

## Root Cause
Most likely the badge tables haven't been created in Supabase yet. The system is detecting badges correctly but failing to save them to the database.
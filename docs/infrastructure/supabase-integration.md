# Supabase Integration Guide

This document describes how the authentication and badge systems have been integrated with Supabase for persistent storage.

## Overview

The application now uses Supabase as the default database for:
- User authentication (users, sessions, audit logs)
- Badge system (user statistics, badges, progress tracking)

The system gracefully falls back to in-memory storage if Supabase is not configured.

## Environment Configuration

Add these environment variables to your `.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key  # Optional, for admin operations
```

## Database Schema

### Authentication Tables (Migration 003)

1. **users** - Core user accounts
   - UUID primary key for authenticated users
   - Email, username, password hash
   - Profile fields (display name, avatar)
   - Verification and activity status

2. **user_sessions** - Active user sessions
   - Refresh token management
   - IP address and user agent tracking
   - Automatic expiration handling

3. **auth_audit_logs** - Authentication events
   - Login, logout, registration events
   - Failed login attempts
   - Security monitoring

4. **password_reset_tokens** - Password recovery
5. **email_verification_tokens** - Email verification

### Badge System Tables (Migrations 002, 004, 005)

1. **badge_definitions** - All possible badges
   - Categories: skill, progression, mode, social, unique, seasonal
   - Tiers: bronze, silver, gold, platinum, diamond
   - Rarity: common, rare, epic, legendary
   - Requirements as JSONB

2. **user_statistics** - Player performance metrics
   - Games played, won, lost
   - Win streaks, solve times
   - Mode-specific stats
   - Supports both UUID (authenticated) and string (guest) user IDs

3. **user_badges** - Earned badges
   - Links users to their unlocked badges
   - Unlock timestamps
   - Progress tracking

4. **badge_progress** - Progress towards unearned badges
   - Current progress values
   - Last updated timestamps

5. **badge_challenges** - Time-based challenges

## Key Changes

### 1. User Repository (`server/src/models/userRepository.ts`)

- Now checks for Supabase configuration
- Uses `SupabaseUserRepository` when available
- Falls back to in-memory Maps for development
- Seamless API compatibility

### 2. Socket Authentication (`server/src/socket/connectionHandler.ts`)

- Authenticated users use their actual user ID for games
- This links game statistics to their account
- Guest users get temporary IDs (e.g., "player-123456-abc")

### 3. Badge System Updates

- **StatisticsService** marks guest users with `is_guest` flag
- Supports both UUID and string user IDs
- Guest statistics can be cleaned up periodically

### 4. New API Endpoints (`server/src/routes/badges.ts`)

- `GET /api/badges/me` - Get authenticated user's badges
- `GET /api/badges/definitions` - Get all badge definitions
- `PUT /api/badges/featured` - Update featured badges
- `GET /api/badges/leaderboard` - Get badge leaderboard

### 5. Frontend Badge Service (`client/src/services/badgeService.ts`)

- Uses API endpoints for authenticated users
- Falls back to Socket.io for guests
- Caches badge definitions locally
- Calculates player levels from badge points

## Migration Steps

1. **Run the migrations in order:**
   ```sql
   -- Run these migrations on your Supabase database
   003_auth_system.sql
   004_badge_system_guest_support.sql
   005_badge_leaderboard_function.sql
   ```

2. **Update environment variables** with your Supabase credentials

3. **Restart the server** - it will automatically detect and use Supabase

## Testing the Integration

1. **Create a new user account**
   - Should create entry in Supabase `users` table
   - Session stored in `user_sessions`
   - Auth events logged in `auth_audit_logs`

2. **Play a game while authenticated**
   - Statistics tracked with actual user ID
   - Badges unlock and persist in database
   - Progress updates in real-time

3. **View badges in profile**
   - Authenticated users load from API
   - Guest users use Socket.io
   - Featured badges persist

## Maintenance

### Cleaning Guest Data

Run periodically to remove old guest statistics:
```sql
SELECT cleanup_old_guest_stats(30); -- Remove guests inactive for 30 days
```

### Monitoring

- Check `auth_audit_logs` for security events
- Monitor `user_statistics` for game activity
- Review badge unlock patterns

## Troubleshooting

1. **"Supabase not configured" warning**
   - Ensure environment variables are set
   - Check Supabase project is active

2. **Badge system not tracking**
   - Verify user ID is being passed correctly
   - Check Supabase RLS policies
   - Ensure service role key has proper permissions

3. **Authentication failures**
   - Check JWT secrets match
   - Verify Supabase URL is correct
   - Review auth audit logs for details
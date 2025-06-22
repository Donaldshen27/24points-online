# Badge System Database Schema

## Overview
The badge system uses a comprehensive database schema to track player achievements, statistics, and progression. The system is designed to be extensible and performant.

## Tables

### 1. `badge_definitions`
Stores all possible badges that can be earned in the game.

**Columns:**
- `id` (VARCHAR(50), PK): Unique identifier (e.g., 'speed_demon_bronze')
- `category` (VARCHAR(30)): Badge category (skill/progression/mode/social/unique/seasonal)
- `name` (VARCHAR(100)): Display name
- `description` (TEXT): Badge description
- `tier` (VARCHAR(20)): Tier level (bronze/silver/gold/platinum/diamond)
- `rarity` (VARCHAR(20)): Rarity level (common/rare/epic/legendary)
- `points` (INTEGER): Points awarded for earning
- `icon_url` (VARCHAR(255)): Badge icon URL
- `requirements` (JSONB): JSON object with badge requirements
- `is_active` (BOOLEAN): Whether badge can be earned
- `created_at`, `updated_at` (TIMESTAMP)

### 2. `user_statistics`
Tracks cumulative player statistics used for badge requirements.

**Key Statistics:**
- Game stats: games played/won/lost, win streaks
- Performance: solve times, accuracy, first solves
- Mode-specific: wins per game mode
- Time-based: consecutive days, time-of-day playing patterns
- Social: unique opponents, spectated games
- Special achievements: comebacks, perfect games, flawless victories

### 3. `user_badges`
Records which badges each user has earned.

**Columns:**
- `id` (SERIAL, PK)
- `user_id` (UUID): User identifier
- `badge_id` (VARCHAR(50), FK): References badge_definitions
- `earned_at` (TIMESTAMP): When badge was earned
- `progress` (JSONB): Progress towards next tier
- `is_featured` (BOOLEAN): Featured on profile

### 4. `badge_progress`
Tracks progress towards incomplete badges.

**Columns:**
- `user_id`, `badge_id` (Composite PK)
- `current_value`: Current progress
- `target_value`: Target to earn badge
- `last_updated`: Last update timestamp

### 5. `badge_challenges`
Daily/weekly challenges for bonus progress.

**Columns:**
- `id` (SERIAL, PK)
- `badge_id` (FK): Target badge
- `challenge_type`: 'daily' or 'weekly'
- `multiplier`: Progress multiplier
- `start_date`, `end_date`: Challenge period
- `is_active`: Active status

## Requirements JSON Structure

### Simple Requirement
```json
{
  "type": "simple",
  "stat": "gamesWon",
  "value": 10,
  "comparison": "gte"
}
```

### Complex Requirement (AND/OR)
```json
{
  "type": "and",
  "conditions": [
    {"type": "simple", "stat": "gamesWon", "value": 50, "comparison": "gte"},
    {"type": "simple", "stat": "winRate", "value": 0.7, "comparison": "gte"}
  ]
}
```

### Custom Requirement
```json
{
  "type": "custom",
  "customType": "comeback_from_0_5",
  "params": {
    "minDeficit": 5
  }
}
```

## Indexes
- User lookup: `idx_user_badges_user`, `idx_user_stats_username`
- Featured badges: `idx_user_badges_featured`
- Active badges/challenges: `idx_badge_definitions_active`, `idx_challenges_active`
- Performance: `idx_badge_progress_user`, `idx_badge_definitions_category`

## Row Level Security
- Badge definitions: Public read access
- User statistics: Users can read own stats, public can view for leaderboard
- User badges: Users can read own, public can see featured badges
- Badge progress: Users can view own progress
- Challenges: Public read access for active challenges

## Migration
Run the migration file: `server/migrations/002_badge_system.sql`

This creates all necessary tables, indexes, and RLS policies for the badge system.
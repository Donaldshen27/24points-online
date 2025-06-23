# ELO Rating Service Implementation

## Overview
The Rating Service manages player ELO ratings, match history, and leaderboards for the 24 Points game. It integrates with the game state manager to automatically update ratings after ranked matches.

## Architecture

### Service Structure
- **Singleton Pattern**: Single instance manages all rating operations
- **Database Integration**: Uses Supabase for persistent storage
- **Async Operations**: All database operations are asynchronous

### Key Components

1. **RatingService** (`/server/src/services/RatingService.ts`)
   - Player rating management
   - Match history tracking
   - Leaderboard generation
   - Disconnect penalty handling

2. **Database Schema** (`/server/src/db/migrations/004_create_elo_tables.sql`)
   - `player_ratings`: Current player ratings and statistics
   - `ranked_matches`: Match history and results
   - `seasons`: Seasonal competition periods
   - `seasonal_ratings`: Season-specific ratings

3. **Game Integration** (`/server/src/game/GameStateManager.ts`)
   - Automatic rating updates on game completion
   - Disconnect penalty application
   - Rating change notifications

## Features

### Rating Management
- **Initial Rating**: New players start at 1200
- **Rating Bounds**: 400 (floor) to 3000 (ceiling)
- **K-Factor Scaling**: Based on games played
  - Placement matches (0-9): K=40
  - New players (10-29): K=30
  - Regular players (30-99): K=20
  - Experienced (100+): K=15

### Match Tracking
- Detailed match records with:
  - Player ratings before/after
  - Match duration and rounds played
  - Individual round wins
  - Season association

### Special Features
- **Inactivity Decay**: -25 rating per 28 days inactive
- **Disconnect Penalty**: -30 rating for leaving ranked games
- **Placement Matches**: First 10 games with higher K-factor
- **Peak Rating Tracking**: Highest rating achieved

### Leaderboard System
- Global rankings by current rating
- Win rate calculations
- Games played statistics
- Tier assignment

## API Usage

### Get Player Rating
```typescript
const rating = await ratingService.getPlayerRating(userId);
// Returns: PlayerRating object with current stats
```

### Update Ratings After Match
```typescript
const result = await ratingService.updateRatingsAfterMatch(
  winnerId,
  loserId,
  'classic', // game mode
  {
    duration: 300, // seconds
    roundsPlayed: 10,
    winnerRoundsWon: 7,
    loserRoundsWon: 3
  }
);
// Returns: { winnerUpdate, loserUpdate, match }
```

### Apply Disconnect Penalty
```typescript
const update = await ratingService.applyDisconnectPenalty(userId);
// Returns: RatingUpdatePayload with -30 rating change
```

### Get Leaderboard
```typescript
const leaderboard = await ratingService.getLeaderboard(100, 0);
// Returns: Array of ranked players with stats
```

## Database Operations

### Automatic Actions
1. **Rating Creation**: New players get rating record on first ranked game
2. **Update Tracking**: `updated_at` timestamp auto-updates
3. **Inactivity Check**: Applied on rating retrieval
4. **Match Recording**: Every ranked game creates match record

### Row Level Security
- All tables have RLS enabled
- Public read access for ratings and matches
- Write access requires authentication

## Integration Points

### Game State Manager
- Calls `updateRatingsAfterMatch()` on game completion
- Applies disconnect penalties on forfeit
- Stores rating updates in room state

### Socket Events (Future)
- `ranked:rating:updated`: Rating change notifications
- `ranked:tier:changed`: Promotion/demotion alerts
- `ranked:leaderboard:updated`: Leaderboard changes

## Error Handling
- Graceful fallbacks for database errors
- Console error logging for debugging
- No interruption to game flow on rating errors

## Future Enhancements
1. **Seasonal System**: Reset and track seasonal ratings
2. **Regional Leaderboards**: Location-based rankings
3. **Win Streak Bonuses**: Extra points for consecutive wins
4. **Rank Protection**: Grace period after promotion
5. **Match Analytics**: Detailed performance metrics
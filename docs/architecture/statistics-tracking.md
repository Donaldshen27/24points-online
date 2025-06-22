# Statistics Tracking System

## Overview
The statistics tracking system collects and aggregates player data to support the badge system. It tracks gameplay metrics, performance statistics, and special achievements.

## Implementation

### 1. StatisticsService
Located at: `server/src/badges/StatisticsService.ts`

Key responsibilities:
- Initialize user statistics on first play
- Update statistics after each game
- Track time-based metrics (consecutive days, time of day)
- Monitor special achievements
- Provide statistics retrieval

### 2. Database Schema

#### user_statistics table
Tracks cumulative player metrics:
- **Game Stats**: games played/won/lost, win streaks
- **Performance**: solve times, accuracy, first solves
- **Mode-specific**: wins per game mode
- **Time-based**: consecutive days, weekend/night games
- **Social**: unique opponents, spectated games
- **Special**: comebacks, perfect games, flawless victories

### 3. Integration Points

#### Game End
When a game ends, the GameStateManager:
1. Calculates final statistics
2. Calls `statisticsService.updateGameStats()`
3. Updates both winner and loser stats
4. Tracks special achievements

#### Round End
During gameplay:
- Solve times tracked per round
- First solver recorded
- Correct/incorrect attempts counted

#### Solo Practice
For solo mode:
- Only puzzle completion tracked
- Fastest solve times updated
- No win/loss statistics

### 4. Statistics Flow

```
Game Event → GameStateManager → StatisticsService → Supabase Database
                                        ↓
                                Badge Detection Service
```

### 5. Key Methods

#### updateGameStats()
- Updates winner/loser statistics
- Calculates derived metrics (accuracy, averages)
- Tracks mode-specific wins
- Updates time-based stats

#### updateTimeBasedStats()
- Consecutive days tracking
- Time-of-day statistics
- Weekend game counting

#### trackSpecialAchievement()
- Comeback wins
- Underdog victories
- Operation-based achievements

### 6. Performance Considerations

- Batch updates to minimize database calls
- Asynchronous processing to not block gameplay
- Error handling to prevent game disruption
- Caching for frequently accessed stats

### 7. Future Enhancements

1. **Historical Tracking**
   - Game-by-game history
   - Score progression tracking
   - Opponent history

2. **Advanced Metrics**
   - Elo rating system
   - Performance trends
   - Skill level estimation

3. **Analytics**
   - Player behavior patterns
   - Popular play times
   - Mode preferences

## Usage

### Initialization
```typescript
// When a new user is created
await statisticsService.initializeUserStats(userId, username);
```

### Game Statistics
```typescript
// After game ends
await statisticsService.updateGameStats(
  gameRoom,
  winnerId,
  loserId,
  gameStats
);
```

### Retrieving Stats
```typescript
// Get user statistics
const stats = await statisticsService.getUserStats(userId);
```

## Testing
1. Play games in different modes
2. Check database for updated statistics
3. Verify special achievement tracking
4. Test time-based statistics
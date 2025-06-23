# Match History and Performance Analytics System

## Overview

The match history and performance analytics system provides comprehensive tracking and analysis of ranked matches, enabling players to review their performance, identify trends, and track improvement over time.

## Database Schema

### Enhanced `ranked_matches` Table
Additional fields added to track detailed match statistics:
- `game_mode`: Type of game played (classic/super/extended)
- `disconnect_forfeit`: Whether the match ended due to disconnection
- `player1_solve_times` / `player2_solve_times`: Array of solve times in milliseconds
- `player1_first_solves` / `player2_first_solves`: Number of rounds won by being first
- `player1_avg_solve_time_ms` / `player2_avg_solve_time_ms`: Average solve time
- `replay_data`: Optional replay information
- `match_statistics`: JSON object with aggregate stats

### New Tables

#### `match_rounds`
Stores round-by-round details for deep analytics:
- `match_id`: Reference to the parent match
- `round_number`: Sequential round number
- `center_cards`: The cards dealt in this round
- `solution`: The winning solution (if any)
- `solver_id`: Player who solved the round
- `solve_time_ms`: Time taken to solve
- `is_timeout`: Whether the round ended in timeout

#### `player_performance_stats`
Aggregated performance statistics per player:
- `total_solve_time_ms`: Total time spent solving
- `total_rounds_played`: Total rounds across all matches
- `total_first_solves`: Total rounds won
- `fastest_solve_ms`: Personal best solve time
- `avg_solve_time_ms`: Calculated average (generated column)
- `win_rate_by_mode`: Win rates for each game mode
- `hourly_performance`: Performance metrics by hour of day
- `opponent_statistics`: Head-to-head records
- `streak_statistics`: Current and best win/loss streaks

## Services

### MatchAnalyticsService

The core service for recording and retrieving match analytics:

```typescript
class MatchAnalyticsService {
  // Record match statistics after game ends
  recordMatchStatistics(matchId, room, winnerId, loserId, disconnectForfeit)
  
  // Get player's match history with filters
  getPlayerMatchHistory(userId, options)
  
  // Get aggregated performance statistics
  getPlayerPerformanceStats(userId)
  
  // Get head-to-head statistics between two players
  getHeadToHeadStats(player1Id, player2Id)
  
  // Get performance trends over time
  getPerformanceTrends(userId, days)
}
```

### Integration with RatingService

The RatingService now returns match IDs when creating match records, allowing the MatchAnalyticsService to enhance them with detailed statistics after the game ends.

## Socket Events

### Client → Server

#### `match:getHistory`
Retrieve match history with optional filters:
```javascript
socket.emit('match:getHistory', {
  userId: 'player-uuid',
  limit: 20,
  offset: 0,
  gameMode: 'classic',  // optional
  startDate: '2024-01-01',  // optional
  endDate: '2024-12-31'  // optional
}, callback);
```

#### `match:getPerformanceStats`
Get aggregated performance statistics:
```javascript
socket.emit('match:getPerformanceStats', {
  userId: 'player-uuid'
}, callback);
```

#### `match:getHeadToHead`
Get head-to-head statistics:
```javascript
socket.emit('match:getHeadToHead', {
  player1Id: 'player1-uuid',
  player2Id: 'player2-uuid'
}, callback);
```

#### `match:getPerformanceTrends`
Get performance trends over time:
```javascript
socket.emit('match:getPerformanceTrends', {
  userId: 'player-uuid',
  days: 30  // optional, defaults to 30
}, callback);
```

## Analytics Features

### Match History
- Complete list of past matches with opponents
- Win/loss record and rating changes
- Average solve times and round statistics
- Filtering by game mode and date range

### Performance Statistics
- Overall win rate and game counts
- Mode-specific performance
- Average solve times and personal records
- Streak tracking (current and best)

### Head-to-Head Records
- Match history against specific opponents
- Win/loss ratio in head-to-head matches
- Recent match results

### Performance Trends
- Daily match activity and win rates
- Rating progression over time
- Solve time improvements
- Weekly averages for consistency tracking

## Database Functions

### `update_player_performance_after_match`
Automatically updates performance statistics after each match:
- Aggregates solve times and round counts
- Updates mode-specific win rates
- Tracks opponent statistics
- Maintains streak records

### `get_match_analytics`
Retrieves detailed match history with computed fields:
- Opponent information
- Win/loss status from player perspective
- Rating changes
- Performance metrics

## Usage Example

```typescript
// In GameStateManager, after ELO update
const analyticsService = MatchAnalyticsService.getInstance();
await analyticsService.recordMatchStatistics(
  match.id,
  this.room,
  winnerId,
  loserId,
  finalReason === 'forfeit'
);

// Client-side usage
socket.emit('match:getHistory', {
  userId: currentUser.id,
  limit: 10,
  gameMode: 'classic'
}, (response) => {
  if (response.success) {
    displayMatchHistory(response.matches);
  }
});
```

## Performance Considerations

1. **Indexes**: Comprehensive indexes on match and performance tables for fast queries
2. **Generated Columns**: Average solve time calculated automatically
3. **Batch Updates**: Performance stats updated in single transaction
4. **Data Retention**: Consider archiving old match data after extended periods

## Future Enhancements

1. **Match Replays**: Store full replay data for reviewing past games
2. **Advanced Analytics**: Machine learning for play style analysis
3. **Achievements**: Unlock special achievements based on performance milestones
4. **Leaderboards**: Specialized leaderboards for different metrics (fastest solver, most consistent, etc.)
5. **Export Features**: Allow players to export their match history and statistics
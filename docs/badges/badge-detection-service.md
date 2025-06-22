# Badge Detection Service

## Overview
The Badge Detection Service automatically checks for and awards badges based on player achievements. It runs after each game and tracks special events during gameplay.

## Architecture

### Core Components

#### 1. BadgeDetectionService
Main service responsible for:
- Checking badge requirements against player statistics
- Awarding new badges
- Tracking badge progress
- Managing tier upgrades

#### 2. Integration Points
- **Post-Game**: Automatically checks all badges after game completion
- **Special Events**: Tracks specific achievements during gameplay
- **Socket API**: Provides endpoints for badge retrieval

### Badge Requirement Evaluation

#### Simple Requirements
Direct stat comparison:
```typescript
{
  type: 'simple',
  stat: 'gamesWon',
  value: 100,
  comparison: 'gte'
}
```

#### Complex Requirements
AND/OR logic combinations:
```typescript
{
  type: 'and',
  conditions: [
    { type: 'simple', stat: 'gamesWon', value: 50, comparison: 'gte' },
    { type: 'simple', stat: 'accuracyRate', value: 0.8, comparison: 'gte' }
  ]
}
```

#### Custom Requirements
Special logic for unique achievements:
- Accuracy rate calculations
- Puzzle record counting
- Time-based achievements
- Operation-specific tracking

### Badge Awarding Process

1. **Post-Game Check**
   - Triggered automatically when game ends
   - Checks all active badge definitions
   - Skips already earned badges (except tiers)

2. **Requirement Evaluation**
   - Recursive evaluation of requirements
   - Support for nested conditions
   - Custom logic for special badges

3. **Award Process**
   - Insert badge record in database
   - Update player's total points
   - Calculate new level

4. **Notification**
   - Emit 'badges-unlocked' event
   - Include badge details and metadata

### Tier System

Badges can have multiple tiers (Bronze → Diamond):
- Automatically checks for tier upgrades
- Awards higher tiers when requirements met
- Tracks previous tier for display

### Progress Tracking

For incomplete badges:
- Updates current vs target values
- Stores in badge_progress table
- Used for progress bars in UI

## Socket API

### get-user-badges
Retrieve user's complete badge collection:
```javascript
socket.emit('get-user-badges', { userId }, (response) => {
  // response: { earned, inProgress, totalPoints, level }
});
```

### get-user-statistics
Get raw player statistics:
```javascript
socket.emit('get-user-statistics', { userId }, (response) => {
  // response: UserStatistics object
});
```

### track-special-badge-event
Track special achievements during gameplay:
```javascript
socket.emit('track-special-badge-event', {
  userId,
  eventType: 'all_operations_used',
  eventData: { /* optional */ }
});
```

## Special Event Types

1. **all_operations_used**: Player used +, -, ×, ÷ in one solution
2. **minimal_operations_win**: Won using only + and -
3. **comeback_win**: Won after being down 0-5
4. **underdog_win**: Beat player with 500+ more games

## Database Tables

### user_badges
- Stores earned badges
- Links users to badge definitions
- Tracks earned date and featured status

### badge_progress
- Tracks progress for incomplete badges
- Current value vs target value
- Updated after each game

## Performance Optimizations

1. **Batch Processing**: Check all badges in single pass
2. **Skip Earned**: Don't recheck completed badges
3. **Async Operations**: Non-blocking badge checks
4. **Error Isolation**: Badge errors don't affect gameplay

## Testing Badge Awards

1. **Force Statistics**:
   ```sql
   UPDATE user_statistics 
   SET games_won = 100 
   WHERE user_id = 'test-user-id';
   ```

2. **Check Badges**:
   ```javascript
   const badges = await badgeDetectionService.checkBadgesAfterGame('test-user-id');
   ```

3. **Verify Awards**:
   ```sql
   SELECT * FROM user_badges WHERE user_id = 'test-user-id';
   ```

## Future Enhancements

1. **Badge Challenges**: Time-limited double progress events
2. **Badge Trading**: Exchange duplicate badges
3. **Badge Showcases**: Custom profile displays
4. **Badge Analytics**: Track popular badges
5. **Achievement Feed**: Social badge announcements
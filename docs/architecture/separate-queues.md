# Separate Ranked vs Casual Queues

## Overview

The matchmaking system now supports two distinct queue types:
- **Ranked Queue**: For competitive play with ELO rating changes
- **Casual Queue**: For practice and fun without affecting ratings

## Key Differences

### Ranked Queue
- Requires authentication (registered users only)
- Uses ELO-based matchmaking with progressive search expansion
- 30-minute cooldown between matches with the same opponent
- No rematch option
- -30 rating penalty for disconnects
- Match results affect player ratings

### Casual Queue
- Open to both authenticated and guest users
- Wide matchmaking range (no strict rating requirements)
- 5-minute cooldown between matches with the same opponent
- Rematch allowed
- No penalties for leaving
- Match results don't affect ratings

## Implementation Details

### MatchmakingService Changes

1. **Separate Queue Storage**
   ```typescript
   private rankedQueue: Map<string, QueueEntry> = new Map();
   private casualQueue: Map<string, QueueEntry> = new Map();
   ```

2. **Queue Entry Structure**
   ```typescript
   interface QueueEntry extends MatchmakingEntry {
     socketId: string;
     username: string;
     queueType: 'ranked' | 'casual';
   }
   ```

3. **Different Cooldown Periods**
   - Ranked: 30 minutes
   - Casual: 5 minutes

### Socket Events

#### Ranked Queue Events
- `ranked:join-queue` - Join ranked matchmaking
- `ranked:leave-queue` - Leave ranked queue
- `ranked:queue-status` - Get queue status
- `ranked:match-found` - Match found notification

#### Casual Queue Events
- `casual:join-queue` - Join casual matchmaking
- `casual:leave-queue` - Leave casual queue
- `casual:queue-status` - Get queue status
- `casual:match-found` - Match found notification

### Room Creation

Rooms created through matchmaking now have the `isRanked` flag set appropriately:
- Ranked matches: `room.isRanked = true`
- Casual matches: `room.isRanked = false`

### Guest User Support

For casual queue, guest users are assigned temporary IDs:
- User ID: `guest-${socketId}`
- Username: `Guest-${randomString}`

## Usage Examples

### Joining Ranked Queue
```javascript
socket.emit('ranked:join-queue', {
  gameMode: 'classic',
  region: 'NA'
});
```

### Joining Casual Queue
```javascript
socket.emit('casual:join-queue', {
  gameMode: 'classic',
  region: 'NA'
});
```

### Handling Match Found
```javascript
socket.on('ranked:match-found', (data) => {
  // data.roomId - Room to join
  // data.queueType - 'ranked'
  // data.opponent - Opponent info
});

socket.on('casual:match-found', (data) => {
  // data.roomId - Room to join
  // data.queueType - 'casual'
  // data.opponent - Opponent info
});
```

## Future Considerations

1. **Queue Preferences**: Allow users to set preferences for game modes
2. **Queue Analytics**: Track average wait times and match quality
3. **Cross-Queue Prevention**: Ensure players can't queue for both simultaneously
4. **Seasonal Queues**: Special event queues with unique rules
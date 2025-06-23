# Matchmaking System Architecture

## Overview
The matchmaking system provides automated player pairing for ranked games based on ELO ratings, ensuring fair and balanced matches while minimizing wait times.

## Core Components

### MatchmakingService (`/server/src/services/MatchmakingService.ts`)
Singleton service managing the matchmaking queue and pairing algorithm.

#### Key Features:
- **Progressive Search Expansion**: Search range widens based on queue time
- **Recent Match Prevention**: 30-minute cooldown between same opponents
- **Region Preference**: Prioritizes players from same region
- **Game Mode Separation**: Separate queues for classic/super/extended modes
- **Real-time Status**: Live queue position and estimated wait times

### Queue Management
```typescript
interface QueueEntry {
  userId: string;
  socketId: string;
  username: string;
  rating: number;
  queueTime: Date;
  searchRange: number;
  gameMode: 'classic' | 'super' | 'extended';
  region?: string;
}
```

### Matchmaking Algorithm

#### Search Range Expansion
- 0-10 seconds: ±50 rating
- 10-30 seconds: ±100 rating
- 30-60 seconds: ±200 rating
- 60-120 seconds: ±400 rating
- 120+ seconds: ±600 rating

#### Match Priority
1. **Game Mode**: Must match exactly
2. **Rating Range**: Must be within current search range
3. **Recent Matches**: Cannot match if played in last 30 minutes
4. **Region**: Prefer same region (50 rating bonus)
5. **Rating Difference**: Minimize absolute difference

### Socket Integration (`/server/src/socket/rankedHandler.ts`)

#### Client Events
- `ranked:join-queue`: Join matchmaking queue
- `ranked:leave-queue`: Leave matchmaking queue
- `ranked:queue-status`: Get current queue status
- `ranked:get-rating`: Get player's current rating
- `ranked:get-leaderboard`: Get global leaderboard
- `ranked:get-match-history`: Get match history

#### Server Events
- `ranked:queue-joined`: Confirmation with initial status
- `ranked:queue-left`: Confirmation of leaving queue
- `ranked:queue-status`: Current position and wait time
- `ranked:match-found`: Match details with opponent info
- `ranked:error`: Error messages for ranked operations

## Match Flow

### 1. Queue Entry
```javascript
// Client
socket.emit('ranked:join-queue', { 
  gameMode: 'classic',
  region: 'NA' 
});

// Server validates and adds to queue
// Returns estimated wait time
```

### 2. Match Search
- Runs every 2 seconds
- Sorts queue by wait time (FIFO)
- Attempts to pair players optimally
- Expands search range for waiting players

### 3. Match Creation
When match found:
1. Remove both players from queue
2. Create ranked room with `isRanked: true`
3. Record match to prevent immediate rematch
4. Notify both players with room and opponent details

### 4. Post-Match
- Rating updates handled by GameStateManager
- Match recorded in database
- Players can requeue immediately

## Queue Status Tracking

### Real-time Updates
- Queue size broadcast every 5 seconds
- Individual status on request
- Estimated wait time calculation

### Wait Time Estimation
```typescript
function estimateWaitTime(playersInRange: number): number {
  if (playersInRange >= 2) return 5;   // Players available
  if (playersInRange === 1) return 15; // One player in range
  return 30;                           // No players in range
}
```

## Authentication Requirements
- Must be logged in to join ranked queue
- Guest players receive error message
- User ID tracked for rating updates

## Error Handling
- Graceful handling of disconnections
- Automatic queue removal on disconnect
- Clear error messages for auth failures
- Fallback for database errors

## Performance Considerations
- O(n²) matching algorithm optimized with early exits
- In-memory queue for fast operations
- Efficient recent match tracking with auto-cleanup
- Minimal database queries during matching

## Future Enhancements
1. **Party Queue**: Queue with friends
2. **Role Selection**: For team modes
3. **Map Voting**: Choose game variants
4. **Skill-based Team Balancing**: For 2v2 modes
5. **Priority Queue**: For premium users
6. **Cross-region Play**: With latency considerations
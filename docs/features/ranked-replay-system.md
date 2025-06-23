# Ranked Match Replay System

## Overview

The replay system allows players to watch and analyze their ranked matches after they've been completed. Every ranked match is automatically recorded with round-by-round details, allowing for comprehensive post-game analysis.

## Architecture

### Data Recording

1. **Match Initialization**
   - When a ranked match is found, a unique match ID is pre-generated
   - The `MatchReplayService` begins recording when the game starts
   - Each round's solution is captured with timing and state information

2. **Round Recording**
   - Center cards dealt
   - Solution details (operations and result)
   - Solver ID and solve time
   - Game state before/after each round

3. **Match Finalization**
   - Final game state is stored
   - Match is marked as having replay available
   - Analytics are computed and stored

### Database Schema

#### `match_replays` Table
Stores individual round data:
- `match_id`: Reference to the ranked match
- `round_number`: Sequential round identifier
- `center_cards`: Cards dealt in the round
- `solution`: The winning solution with operations
- `solver_id`: Player who solved the round
- `solve_time_ms`: Time taken to solve
- `game_state_before/after`: Optional state snapshots

#### Enhanced `ranked_matches` Table
- `has_replay`: Boolean flag for replay availability
- `replay_version`: Version for future compatibility
- `final_game_state`: Final state snapshot

## Socket Events

### Replay Retrieval

#### `replay:getMatch`
Get complete replay data for a specific match:
```javascript
socket.emit('replay:getMatch', {
  matchId: 'match-uuid'
}, (response) => {
  if (response.success) {
    const { matchData, rounds } = response.replay;
    // matchData contains player info, ratings, duration
    // rounds contains array of round-by-round data
  }
});
```

#### `replay:getPlayerReplays`
Get list of available replays for a player:
```javascript
socket.emit('replay:getPlayerReplays', {
  userId: 'player-uuid',
  limit: 10,
  offset: 0
}, (response) => {
  if (response.success) {
    // response.replays contains array of replay summaries
  }
});
```

#### `replay:watch`
Join a replay room for synchronized playback:
```javascript
socket.emit('replay:watch', {
  matchId: 'match-uuid'
}, (response) => {
  if (response.success) {
    // Joined replay room, can now control playback
  }
});
```

## Integration Points

### GameStateManager
- Sets match ID when ranked game starts via `setMatchId()`
- Records each successful solution with `MatchReplayService.recordGameRound()`
- Finalizes replay data when game ends

### RatingService
- Accepts optional match ID parameter in `updateRatingsAfterMatch()`
- Uses pre-created match ID for consistency between systems

### RankedHandler
- Pre-generates match ID when ranked match is found
- Passes match ID to GameStateManager for replay recording
- Includes match ID in match-found notifications

## Replay Features

### Basic Playback
- Step through rounds sequentially
- View each solution with animations
- See score progression and deck changes

### Analysis Features
- Time taken for each solve
- Solution efficiency metrics
- Head-to-head comparison
- Rating changes visualization

### Future Enhancements
1. **Shared Replay Viewing**
   - Watch replays with friends
   - Commentary system
   - Synchronized playback controls

2. **Advanced Analytics**
   - Heatmaps of solve times
   - Common solution patterns
   - Mistake analysis

3. **Educational Features**
   - Alternative solution suggestions
   - Difficulty ratings per round
   - Training mode from replays

## Usage Example

### Recording a Match
```typescript
// In GameStateManager when solution is validated
if (this.room.isRanked && this.currentMatchId) {
  const replayService = MatchReplayService.getInstance();
  await replayService.recordGameRound(
    this.currentMatchId,
    this.room,
    this.room.currentRound,
    solution,
    playerId,
    solveTimeMs
  );
}
```

### Viewing a Replay
```typescript
// Client-side replay viewer
const loadReplay = async (matchId: string) => {
  socket.emit('replay:getMatch', { matchId }, (response) => {
    if (response.success) {
      const { matchData, rounds } = response.replay;
      
      // Display match info
      showMatchInfo(matchData);
      
      // Initialize replay player
      replayPlayer.loadRounds(rounds);
      replayPlayer.play();
    }
  });
};
```

## Performance Considerations

1. **Efficient Storage**
   - Only essential data is stored per round
   - Game states are optional and compressed
   - Indexes on match_id for fast retrieval

2. **Lazy Loading**
   - Replay list shows summaries only
   - Full replay data loaded on demand
   - Pagination for replay lists

3. **Cleanup Policy**
   - Consider archiving old replays after X months
   - Compress rarely accessed replays
   - Maintain recent replays in hot storage
# Ranked Game Rules and Penalties

## Overview

Ranked games in 24 Points have specific rules and penalties to ensure competitive integrity and fair play.

## Ranked-Specific Rules

### 1. No Rematch Option
- Unlike casual games, rematch is disabled in ranked matches
- Players must re-queue to play another ranked game
- This prevents:
  - Win trading between players
  - Repeated matches against the same opponent
  - Rating manipulation

### 2. Disconnect Penalties
- **Penalty**: -30 rating points for disconnecting during an active game
- **Auto-forfeit Timer**: 30 seconds after disconnect
- **When Applied**: Only during active game states (PLAYING, SOLVING, ROUND_END, REPLAY)
- **Not Applied**: During WAITING state or after game completion

### 3. Authentication Required
- Only registered and logged-in users can play ranked
- Guest users are directed to casual queue
- Ensures accountability and persistent rating tracking

### 4. Rating Changes
- Winners gain rating based on ELO formula
- Losers lose rating based on ELO formula
- K-factors vary based on games played:
  - New players (< 30 games): K=40
  - Experienced (30-100 games): K=20
  - Veterans (> 100 games): K=10

## Implementation Details

### Rematch Prevention
```typescript
socket.on('request-rematch', () => {
  const room = roomManager.getRoomBySocketId(socket.id);
  
  // Prevent rematch in ranked games
  if (room.isRanked) {
    socket.emit('rematch-error', { 
      message: 'Rematch is not allowed in ranked games' 
    });
    return;
  }
  // ... handle casual rematch
});
```

### Disconnect Handling
```typescript
// In GameStateManager.handleAutoForfeit()
if (this.room.isRanked) {
  const ratingService = RatingService.getInstance();
  ratingService.applyDisconnectPenalty(playerId)
    .then(update => {
      console.log(`Applied disconnect penalty: -${update.ratingChange} rating`);
    });
}
```

### Penalty Constants
- **Disconnect Penalty**: 30 rating points
- **Auto-forfeit Timer**: 30 seconds
- **Recent Match Cooldown**: 30 minutes (prevents immediate rematch via queue)

## Player Experience

### What Players See

1. **No Rematch Button**: After a ranked game ends, the rematch button is hidden
2. **Disconnect Warning**: Players see a warning about rating loss if they disconnect
3. **Rating Changes**: Immediate display of rating gain/loss after each game
4. **Rank Updates**: Visual feedback for promotions/demotions

### Error Messages

- **Rematch Attempt**: "Rematch is not allowed in ranked games"
- **Guest Queue Attempt**: "Must be logged in to play ranked"
- **Disconnect Penalty**: "You lost 30 rating points for disconnecting"

## Fair Play Considerations

1. **Win Trading Prevention**
   - No rematch option
   - 30-minute cooldown between matches with same opponent
   - All matches logged for review

2. **Disconnect Abuse Prevention**
   - Immediate -30 rating penalty
   - Loss recorded in match history
   - Repeated disconnects tracked for potential further action

3. **Smurf Detection** (Future)
   - Abnormal win rates monitored
   - Rapid rating gains flagged
   - Account age considered

## Testing the Rules

1. **Test Rematch Block**
   ```bash
   # Play a ranked game to completion
   # Try to request rematch
   # Should receive error message
   ```

2. **Test Disconnect Penalty**
   ```bash
   # Start a ranked game
   # Disconnect during play
   # Check rating decreased by 30
   ```

3. **Test Authentication**
   ```bash
   # Try to join ranked queue as guest
   # Should receive authentication error
   ```
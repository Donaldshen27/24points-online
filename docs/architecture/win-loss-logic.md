# Win/Loss Logic Documentation

## Overview
The win/loss logic in the 24 Points game determines round winners, manages card transfers, handles game-ending conditions, and implements a rematch system.

## Round Result Handling

### Round End Conditions
1. **Correct Solution**: Player who submits a correct solution (equals 24) wins the round
2. **Incorrect Solution**: Player who submits an incorrect solution loses the round
3. **Timeout**: No winner if the 2-minute round timer expires
4. **No Solution**: No winner if no valid solution exists for the cards

### Card Transfer Rules
- **Winner/Loser Determined**: Loser takes all 4 center cards
- **No Winner**: Each player takes back their own 2 cards
- Cards are added to the player's deck immediately after round ends

## Game End Conditions

### Victory Conditions
1. **No Cards Left**: A player wins when their deck reaches 0 cards
2. **All Cards**: A player loses (opponent wins) when their deck reaches 20 cards

### Game State Tracking
The `GameStateManager` tracks:
- Current game state (WAITING, PLAYING, SOLVING, ROUND_END, GAME_OVER)
- Round results with reason codes
- Final game results with win conditions
- Player scores (rounds won)

## Components

### Server-Side Components

#### GameStateManager
- Manages game flow and state transitions
- Handles card transfers in `endRound()`
- Checks win conditions after each round
- Stores round and game results

#### RoomManager
- Interfaces between socket handlers and game logic
- Provides access to game results
- Manages room-level operations

#### Socket Event Handlers
- `round-ended`: Emitted with winner/loser info and reason
- `game-over`: Emitted with final winner and statistics
- `request-rematch`: Handles rematch requests

### Client-Side Components

#### RoundResult Component
- Displays round outcome with animation
- Shows winner/loser information
- Displays solution if submitted
- Auto-continues after 5 seconds

#### GameOver Component
- Shows final game results
- Displays match statistics:
  - Total rounds played
  - Rounds won/lost
  - Win rate percentage
  - Final card counts
- Handles rematch requests

#### CardTransfer Component
- Animates cards moving from center to losing player
- Visual feedback for card transfers
- Staggered animations for multiple cards

## Rematch System

### Rematch Flow
1. Either player can request a rematch after game ends
2. System tracks which players have requested
3. When both players request, game automatically resets
4. Players see opponent's rematch status

### Implementation Details
- Rematch requests stored in `GameRoom.rematchRequests` Set
- `request-rematch` socket event handles requests
- `opponent-wants-rematch` notifies other player
- `rematch-started` triggers game reset

## Socket Events

### Round End Events
```typescript
// Server emits when round ends
socket.emit('round-ended', {
  winnerId: string | null,
  loserId: string | null,
  solution: Solution,
  correct: boolean,
  reason: 'correct_solution' | 'incorrect_solution' | 'no_solution' | 'timeout'
});
```

### Game Over Events
```typescript
// Server emits when game ends
socket.emit('game-over', {
  winnerId: string,
  scores: { [playerId: string]: number },
  finalDecks: { [playerId: string]: number }
});
```

### Rematch Events
```typescript
// Client requests rematch
socket.emit('request-rematch');

// Server notifies opponent
socket.emit('opponent-wants-rematch', { playerId: string });

// Server starts rematch
socket.emit('rematch-started');
```

## Visual Feedback

### Round Result Display
- Success/failure color themes
- Winner/loser labels
- Card recipient indication
- Solution display for learning

### Card Transfer Animation
- Cards animate from center to losing player
- Staggered timing for visual appeal
- Direction indicates recipient (top/bottom)

### Game Over Screen
- Victory/defeat themes
- Comprehensive statistics
- Clear rematch UI
- Option to return to lobby

## Testing Considerations

### Test Scenarios
1. Correct solution submission
2. Incorrect solution submission
3. Round timeout handling
4. No solution detection
5. Game end by no cards
6. Game end by all cards
7. Rematch flow with both players
8. Disconnection during game

### Edge Cases
- Simultaneous solution claims
- Network delays during transfers
- Reconnection after round end
- Rematch with disconnected player
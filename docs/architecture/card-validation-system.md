# Card Validation System

## Overview
The 24 Points game now includes a robust card validation system to ensure all dealt cards have at least one valid solution to reach 24.

## How It Works

### 1. Pre-Deal Validation (DeckManager)
- When dealing cards, the system tries up to 100 different combinations
- Shuffles decks every 10 attempts to increase randomness
- Uses the Calculator's `hasSolution()` method to verify solvability
- Only deals cards once a valid combination is found

### 2. Post-Deal Validation (GameStateManager)
- After cards are dealt, performs a double-check validation
- If no solution exists (rare edge case):
  - Returns cards to their respective owners
  - Emits a 'cards-redealing' event to notify players
  - Automatically starts a new round after 100ms delay

### 3. Calculator Logic
The Calculator checks all possible:
- **Permutations**: All arrangements of the 4 cards
- **Operations**: All combinations of +, -, *, /
- **Groupings**: All possible parentheses structures:
  - ((a op b) op c) op d
  - (a op (b op c)) op d
  - a op ((b op c) op d)
  - a op (b op (c op d))
  - (a op b) op (c op d)

### 4. Client Notification
When cards need to be redealt:
```javascript
socket.on('cards-redealing', (data) => {
  // data.message: "No solution found, redealing cards..."
  // Show notification to players
});
```

## Benefits
1. **Fair Gameplay**: Every round is guaranteed to be solvable
2. **Transparent**: Players are notified when redealing occurs
3. **Efficient**: Most combinations are found within 1-3 attempts
4. **Robust**: Double validation ensures reliability

## Edge Cases Handled
- When decks have limited cards remaining
- When random combinations repeatedly fail
- Division by zero in calculations
- Floating point precision issues (uses epsilon comparison)
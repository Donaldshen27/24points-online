# Extended Room Type Documentation

## Overview
The Extended room type is a variant of the 24 Points game that uses an expanded card range from 1-20 instead of the traditional 1-10 range. This creates more challenging puzzles and different strategic dynamics.

## Key Features

### Card Range
- **Extended Mode**: Cards numbered 1-20 (20 cards per player)
- **Classic Mode** (for comparison): Cards numbered 1-10 (10 cards per player)

### Game Configuration
```typescript
{
  id: 'extended',
  displayName: 'Extended Range',
  description: 'Extended mode with cards from 1-20',
  playerCount: 2,
  cardsPerPlayer: 20,
  cardsPerDraw: 4,
  rules: {
    turnTimeLimit: 150,      // 2.5 minutes per round
    solutionTimeLimit: 35,   // 35 seconds to submit solution
    scoringSystem: 'extended',
    winCondition: 'no_cards',
  }
}
```

### Scoring System
The Extended scoring system rewards players for using higher-value cards:
- Base score: 1 point per round won
- High card bonus: +0.5 points for each card above 10 used in the solution

Example: A solution using cards [13, 17, 2, 4] would score:
- Base: 1 point
- Bonus: 0.5 × 2 (for cards 13 and 17) = 1 point
- Total: 2 points

### Win Conditions
Same as classic mode:
- **Victory**: First player to run out of cards
- **Defeat**: Player accumulates all 40 cards (20 × 2 players)

## Implementation Details

### Server-Side Components

1. **ExtendedGameRules** (`server/src/game/rules/ExtendedGameRules.ts`)
   - Extends `BaseGameRules`
   - Initializes decks with cards 1-20
   - Implements extended scoring logic
   - Handles win condition checking for 40 total cards

2. **GameStateManager Integration**
   - Automatically selects `ExtendedGameRules` when room type is 'extended'
   - No changes needed to core game flow

3. **Room Configuration**
   - Added to `ROOM_TYPE_CONFIGS` in `server/src/config/roomTypes.ts`
   - Available through room creation API

### Client-Side Components

1. **Room Type Selection**
   - Extended mode appears in `RoomTypeSelector` component
   - Users can select it when creating a new room

2. **Visual Considerations**
   - Card components automatically display values 1-20
   - No special UI changes needed

## Strategic Differences

### Compared to Classic Mode
1. **More complex calculations**: Higher numbers create more challenging arithmetic
2. **Different solution patterns**: New number combinations possible
3. **Increased difficulty**: Some combinations may be harder to solve
4. **Scoring strategy**: Players must balance speed vs using high cards for bonus points

### Tips for Players
- Practice with larger numbers to improve calculation speed
- Remember that higher cards give bonus points
- Some combinations with high numbers may have fewer solutions
- Mental math becomes more challenging with values 15-20

## API Usage

### Creating an Extended Room
```javascript
socketService.createRoom(playerName, 'extended');
```

### Room Type Detection
```javascript
const config = getRoomTypeConfig('extended');
if (config) {
  console.log(`Cards per player: ${config.cardsPerPlayer}`); // 20
  console.log(`Scoring system: ${config.rules.scoringSystem}`); // 'extended'
}
```

## Future Enhancements
- Consider adding difficulty levels within Extended mode
- Implement special rules for certain card combinations
- Add achievements for using all high cards (15-20) in a solution
- Consider time bonus scaling based on card values used
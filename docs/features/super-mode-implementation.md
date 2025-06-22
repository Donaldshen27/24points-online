# Super Mode Implementation

## Overview
Super Mode is an advanced game variant where players deal 7 cards to the center instead of the traditional 4 cards. This creates more complex puzzles and rewards players for using more cards in their solutions.

## Key Features

### 1. Game Configuration
- **Cards per player**: 14 (instead of 10)
- **Cards dealt**: 7 (instead of 4)
- **Time limits**: 150s per round, 40s per solution
- **Scoring**: Complexity-based scoring system

### 2. Scoring System
Super Mode uses a complexity scoring system:
- Base score: 1 point
- Using 5+ cards: +1 point
- Using 6+ cards: +1 point
- Using all 7 cards: +2 points (5 total possible)
- Speed bonus (< 10 seconds): +1 point
- Using multiplication/division: +1 point

Maximum possible score per round: 7 points

### 3. Game Rules
- Players can use ANY combination of the 7 center cards (minimum 2)
- They don't have to use all cards
- Win condition remains the same (first to run out of cards)
- Each player starts with 14 cards (1-10 plus 4 extra cards valued 1-4)

## Technical Implementation

### Backend Changes

#### 1. Room Type Configuration
```typescript
// server/src/config/roomTypes.ts
super: {
  id: 'super',
  displayName: 'Super Mode',
  description: 'Advanced mode with 7 center cards',
  playerCount: 2,
  cardsPerPlayer: 14,
  cardsPerDraw: 7,
  // ... other config
}
```

#### 2. SuperGameRules Class
```typescript
// server/src/game/rules/SuperGameRules.ts
- Initializes 14-card decks
- Deals 7 cards alternating between players
- Validates solutions allowing partial card usage
- Implements complexity-based scoring
```

#### 3. GameStateManager Updates
- Updated to use configurable card counts
- Integrated with game rules for validation
- Dynamic scoring based on room type

### Frontend Changes

#### 1. Room Type Selector
- Visual component for choosing game modes
- Shows mode features and player counts
- Smooth animations and hover effects

#### 2. Super Mode Display
- Uses InteractiveCenterTable for all modes (supports any card count)
- Added hint text below cards for Super Mode
- Maintains full card interaction with operator menu
- Responsive grid automatically handles 7 cards

#### 3. GameScreen Integration
- Detects room type and shows appropriate hint
- Uses same interaction system for all modes
- Fixed: Cards in Super Mode are now clickable with operator menu
- Maintains compatibility with existing features

## User Experience

### Room Creation Flow
1. Enter player name
2. Select "Super Mode" from game mode selector
3. Create room or use quick match
4. Wait for opponent to join

### Gameplay Flow
1. 7 cards dealt to center
2. Players race to find solutions
3. Can use 2-7 cards in any combination
4. Scoring rewards complexity and speed
5. Winner takes no cards, loser takes all 7

### Visual Design
- Golden star icon for Super Mode
- Pulsing animation on room type card
- Special grid layout for 7 cards
- Hint text with lightbulb icon
- Complexity scoring badges

## Testing

### Manual Testing Steps
1. Start server: `npm run dev`
2. Open two browser windows
3. Create Super Mode room as Player 1
4. Join room as Player 2
5. Ready up both players
6. Verify 7 cards are dealt
7. Test solution with various card combinations
8. Verify scoring calculation
9. Check win conditions

### Automated Test
Run: `node test-super-mode.js`

This tests:
- Room type retrieval
- Super Mode room creation
- Player joining
- Game initialization
- Card dealing (7 cards)
- Basic game flow

## Future Enhancements

1. **Power Cards**: Special ability cards in Super Mode
2. **Tournament Mode**: Multi-round competitions
3. **Leaderboards**: Track high scores per mode
4. **Achievements**: Unlock rewards for complex solutions
5. **AI Hints**: Help players find solutions in Super Mode

## Migration Notes

- Existing rooms default to 'classic' mode
- No database required - all config in code
- Backward compatible with current games
- Easy to add more room types
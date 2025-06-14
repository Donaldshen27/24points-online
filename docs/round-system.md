# Round System Documentation

## Overview

The 24 Points game round system manages the core gameplay loop where players race to find solutions using the dealt cards. This system includes card dealing, timers, solution claiming, and round transitions.

## Architecture

### Components

#### GameScreen (`client/src/components/GameScreen/GameScreen.tsx`)

The main game interface that orchestrates the round system.

**Key Features:**
- Displays current round state and cards
- Shows round timer and player information
- Handles solution claiming and submission
- Manages round transitions and game over state

#### RoundTimer (`client/src/components/RoundTimer/RoundTimer.tsx`)

A circular progress timer component that visualizes remaining time.

**Features:**
- Visual countdown with circular progress
- Color-coded states (normal, warning, urgent)
- Animated pulse effect for urgent state
- Responsive design

**Props:**
```typescript
interface RoundTimerProps {
  timeRemaining: number;  // Seconds remaining
  isUrgent?: boolean;     // Force urgent state
}
```

#### RoundResult (`client/src/components/RoundResult/RoundResult.tsx`)

Displays round results after completion.

**Features:**
- Shows winner/loser information
- Displays solution if available
- Auto-continues after 5 seconds
- Different styles for success/failure/neutral states

**Props:**
```typescript
interface RoundResultProps {
  winnerId: string | null;
  winnerName?: string;
  loserId: string | null;
  loserName?: string;
  solution?: Solution;
  reason: 'correct_solution' | 'incorrect_solution' | 'no_solution' | 'timeout';
  onContinue: () => void;
}
```

### Round Flow

1. **Round Start**
   - Server deals 2 cards from each player's deck to center
   - Round timer starts (2 minutes)
   - Players see the 4 center cards
   - "I know it!" button becomes available

2. **Solution Claiming**
   - First player to press "I know it!" claims the round
   - Round timer pauses
   - Solution timer starts (30 seconds)
   - Other player sees "Opponent is solving..."

3. **Solution Submission**
   - Claiming player builds solution using SolutionBuilder
   - Solution is validated server-side
   - If correct: claimer wins, opponent takes all cards
   - If incorrect: claimer loses and takes all cards

4. **Round End**
   - RoundResult component shows outcome
   - Cards are transferred based on result
   - After 5 seconds (or manual continue), next round starts

5. **Special Cases**
   - **No Solution**: If no valid 24-point solution exists, round ends after 10 seconds
   - **Timeout**: If no one claims within 2 minutes, cards return to owners
   - **Claim Timeout**: If claimer doesn't submit within 30 seconds, they lose

## Timer System

The round system uses two types of timers:

### Round Timer (2 minutes)
- Counts down during normal play
- Visual states:
  - Green (> 30 seconds)
  - Orange (10-30 seconds)  
  - Red + pulsing (< 10 seconds)

### Solution Timer (30 seconds)
- Active only when a player is solving
- Always shows urgent styling
- Auto-fails if time expires

## UI States

### Playing State
```
- Center cards visible and interactive
- "I know it!" button enabled
- Round timer counting down
- Both player hands visible
```

### Solving State (Claimer)
```
- Solution builder modal open
- Solution timer counting down
- Cards selectable for building expression
```

### Solving State (Waiting)
```
- "Opponent is solving..." message
- Cards non-interactive
- No timer visible
```

### Round End State
```
- Round result overlay
- Shows winner/loser
- Displays solution if available
- Auto-continue countdown
```

## Socket Events

### Client → Server
- `claim-solution`: Player claims they know the solution
- `submit-solution`: Player submits their solution attempt

### Server → Client
- `round-started`: New round begins with center cards
- `solution-claimed`: Someone claimed the solution
- `round-ended`: Round complete with results
- `game-state-updated`: Full game state sync

## Integration with Game State

The round system integrates with the GameStateManager on the server:

```typescript
// Server-side round flow
1. startNewRound() - Deals cards, sets timers
2. claimSolution(playerId) - Handles claim, switches to SOLVING
3. submitSolution(playerId, solution) - Validates and ends round
4. endRound(result) - Transfers cards, checks win conditions
```

## Visual Design

### Card Dealing Animation
- Cards animate from top with staggered delays
- Rotation and scale effects
- 0.8s total animation time

### Selection Feedback
- Selected cards lift up with translateY
- Golden border with glow effect
- Pulsing animation

### Timer Visual
- Circular SVG progress indicator
- Smooth color transitions
- Responsive sizing

## Future Enhancements

1. **Power-ups**: Special abilities to extend time or get hints
2. **Combo System**: Bonus points for consecutive wins
3. **Statistics**: Track average solve time, success rate
4. **Replay System**: Review solutions after round ends
5. **Spectator View**: Allow others to watch ongoing rounds
# Game State Management Documentation

## Overview

The 24 Points game uses a comprehensive state management system to handle game flow, player interactions, and real-time synchronization between clients. The system is built around a central `GameStateManager` class on the server and a `useGameState` hook on the client.

## Architecture

### Server-Side Components

#### GameStateManager (`server/src/game/GameStateManager.ts`)

The core class responsible for managing game state transitions, validating moves, and enforcing game rules.

**Key Features:**
- **State Transitions**: Manages transitions between WAITING → PLAYING → SOLVING → ROUND_END → GAME_OVER states
- **Timer Management**: Handles round timers (2 minutes) and solution timers (30 seconds)
- **Card Distribution**: Manages card dealing and transfers between players
- **Win Conditions**: Detects when a player wins (no cards left) or loses (has all 20 cards)
- **Disconnection Handling**: Preserves game state when players disconnect

**Main Methods:**
- `initializeGame(player1, player2)`: Sets up initial game state with two players
- `startGame()`: Begins the first round when both players are ready
- `claimSolution(playerId)`: Handles when a player claims they know the solution
- `submitSolution(playerId, solution)`: Validates and processes solution attempts
- `handleDisconnect/Reconnect(playerId)`: Manages player connection states

#### RoomManager Updates (`server/src/socket/RoomManager.ts`)

Enhanced to integrate with GameStateManager:
- Creates GameStateManager instance for each room
- Provides methods for game operations (start, claim, submit, reset)
- Handles player-specific state views (hiding opponent's cards)

### Client-Side Components

#### useGameState Hook (`client/src/hooks/useGameState.ts`)

A React hook that manages game state on the client side and provides an interface for game actions.

**Features:**
- **Real-time State Sync**: Listens to socket events for state updates
- **Timer Management**: Tracks round and solution timers on the client
- **Action Methods**: Provides functions to claim solutions, submit answers, request hints
- **Computed Properties**: Calculates if player can claim, is currently solving, etc.

**Hook Interface:**
```typescript
interface GameStateHook {
  gameState: GameRoom | null;
  currentRound: number;
  centerCards: Card[];
  isMyTurn: boolean;
  canClaimSolution: boolean;
  isSolving: boolean;
  timeRemaining: number | null;
  claimSolution: () => void;
  submitSolution: (solution: Solution) => void;
  requestHint: () => void;
  resetGame: () => void;
}
```

## Game States

The game progresses through five distinct states:

1. **WAITING**: Players joining, waiting for both to be ready
2. **PLAYING**: Active round, players can see cards and claim solutions
3. **SOLVING**: One player has claimed and is entering their solution
4. **ROUND_END**: Round complete, showing results and transferring cards
5. **GAME_OVER**: Game finished, showing final winner

## Socket Events

### Server → Client Events

- `game-state-updated`: Sends personalized game state to each player
- `round-started`: Notifies start of new round with center cards
- `solution-claimed`: Broadcasts when a player claims solution
- `round-ended`: Sends round results and winner/loser info
- `game-over`: Final game results with winner and scores
- `game-reset`: Game has been reset to initial state

### Client → Server Events

- `claim-solution`: Player claims they know the solution
- `submit-solution`: Player submits their solution attempt
- `request-hint`: Player requests a hint (future feature)
- `reset-game`: Request to reset the game

## State Synchronization

The system ensures consistent state across all clients through:

1. **Server Authority**: All state changes go through the server
2. **Personalized Views**: Each player receives their own view (opponent's cards hidden)
3. **Event Broadcasting**: State changes trigger events to all relevant clients
4. **Validation**: All actions are validated before state changes

## Timer System

Two types of timers manage game pacing:

1. **Round Timer** (2 minutes)
   - Starts when cards are dealt
   - Ends round automatically on timeout
   - Paused when someone claims solution

2. **Solution Timer** (30 seconds)
   - Starts when player claims solution
   - Auto-fails if player doesn't submit in time
   - Only one player can claim at a time

## Error Handling

The system includes comprehensive error handling:

- Invalid state transitions are prevented
- Network disconnections preserve game state
- Timer conflicts are resolved server-side
- All client actions are validated before processing

## Usage Example

```typescript
// In a React component
const GameBoard: React.FC = () => {
  const { playerId } = useContext(GameContext);
  const {
    gameState,
    centerCards,
    canClaimSolution,
    isMyTurn,
    timeRemaining,
    claimSolution,
    submitSolution
  } = useGameState(playerId);

  const handleClaimClick = () => {
    if (canClaimSolution) {
      claimSolution();
    }
  };

  const handleSolutionSubmit = (solution: Solution) => {
    if (isMyTurn) {
      submitSolution(solution);
    }
  };

  return (
    <div>
      {/* Game UI components */}
    </div>
  );
};
```

## Future Enhancements

1. **State Persistence**: Save game state to database for recovery
2. **Spectator Mode**: Allow observers to watch games
3. **Replay System**: Record and replay games
4. **Advanced Hints**: Implement progressive hint system
5. **Tournament Mode**: Support for multiple concurrent games
# Room Type Architecture Design

## Overview
This document outlines a scalable architecture for supporting multiple room types in the 24 Points game, including Classic (2-player), Team 2v2, and Super modes.

## Architecture Components

### 1. Core Interfaces and Base Classes

```typescript
// Base interface for room type configuration
interface RoomTypeConfig {
  id: string;                    // 'classic', 'team2v2', 'super'
  displayName: string;           // Human-readable name
  description: string;           // Description for UI
  playerCount: number;           // 2 or 4
  cardsPerPlayer: number;        // 10 for classic, 14 for super
  cardsPerDraw: number;          // 2 for classic/team, 7 for super
  teamBased: boolean;            // true for 2v2
  minPlayers: number;            // Minimum to start
  maxPlayers: number;            // Maximum allowed
  rules: RuleConfiguration;      // Type-specific rules
  features: RoomFeatures;        // Available features
}

interface RuleConfiguration {
  turnTimeLimit: number;         // Time per turn in seconds
  solutionTimeLimit: number;     // Time to submit solution
  scoringSystem: ScoringType;    // 'classic' | 'speed' | 'complexity'
  winCondition: WinCondition;    // How to determine winner
  allowSpectators: boolean;      // Can others watch?
  requireExactMatch: boolean;    // Must equal exactly 24?
}

interface RoomFeatures {
  hasTimer: boolean;
  hasChat: boolean;
  hasVoice: boolean;
  hasReplay: boolean;
  hasStatistics: boolean;
  hasTournamentMode: boolean;
}

enum WinCondition {
  NO_CARDS = 'no_cards',         // Classic - first to run out
  ALL_CARDS = 'all_cards',       // Classic - opponent has all
  POINT_LIMIT = 'point_limit',   // First to X points
  TIME_LIMIT = 'time_limit',     // Most points after time
  ROUND_LIMIT = 'round_limit'    // Most points after X rounds
}
```

### 2. Game Rules Strategy Pattern

```typescript
// Abstract base class for game rules
abstract class GameRules {
  constructor(protected config: RoomTypeConfig) {}
  
  abstract initializeGame(players: Player[]): void;
  abstract dealCards(): Card[];
  abstract validateSolution(solution: Solution, centerCards: Card[]): boolean;
  abstract calculateScore(solution: Solution, timeElapsed: number): number;
  abstract determineRoundWinner(submissions: Submission[]): string | null;
  abstract checkGameEnd(gameState: GameRoom): GameEndResult | null;
  abstract handlePlayerAction(action: PlayerAction): ActionResult;
}

// Concrete implementations
class ClassicGameRules extends GameRules {
  initializeGame(players: Player[]): void {
    // 2 players, 10 cards each
  }
  
  dealCards(): Card[] {
    // Each player contributes 2 cards
  }
}

class Team2v2GameRules extends GameRules {
  private teams: Team[];
  
  initializeGame(players: Player[]): void {
    // Form 2 teams of 2 players
    // 10 cards per player, shared within team
  }
  
  dealCards(): Card[] {
    // Each team contributes 2 cards (1 per player)
  }
  
  validateTeamCommunication(action: TeamAction): boolean {
    // Validate team-specific actions
  }
}

class SuperGameRules extends GameRules {
  initializeGame(players: Player[]): void {
    // 2 players, 14 cards each
  }
  
  dealCards(): Card[] {
    // 7 cards drawn to center
  }
  
  calculateScore(solution: Solution, timeElapsed: number): number {
    // Bonus points for using more cards
  }
}
```

### 3. Room Factory Pattern

```typescript
class RoomFactory {
  private static roomTypes: Map<string, RoomTypeConfig> = new Map([
    ['classic', CLASSIC_CONFIG],
    ['team2v2', TEAM2V2_CONFIG],
    ['super', SUPER_CONFIG]
  ]);
  
  static createRoom(
    roomType: string, 
    roomId: string, 
    creator: Player
  ): TypedGameRoom {
    const config = this.roomTypes.get(roomType);
    if (!config) {
      throw new Error(`Unknown room type: ${roomType}`);
    }
    
    const rules = this.createRules(roomType, config);
    const stateManager = this.createStateManager(roomType, config);
    
    return new TypedGameRoom(roomId, config, rules, stateManager, creator);
  }
  
  private static createRules(type: string, config: RoomTypeConfig): GameRules {
    switch (type) {
      case 'classic':
        return new ClassicGameRules(config);
      case 'team2v2':
        return new Team2v2GameRules(config);
      case 'super':
        return new SuperGameRules(config);
      default:
        throw new Error(`No rules implementation for type: ${type}`);
    }
  }
  
  private static createStateManager(
    type: string, 
    config: RoomTypeConfig
  ): GameStateManager {
    // Create appropriate state manager for room type
    return new TypedGameStateManager(config);
  }
  
  static getRoomTypes(): RoomTypeInfo[] {
    return Array.from(this.roomTypes.values()).map(config => ({
      id: config.id,
      displayName: config.displayName,
      description: config.description,
      playerCount: config.playerCount,
      teamBased: config.teamBased,
      available: true // Could check server capacity
    }));
  }
}
```

### 4. Enhanced Room Structure

```typescript
interface TypedGameRoom extends GameRoom {
  roomType: string;
  config: RoomTypeConfig;
  rules: GameRules;
  teams?: Team[];                    // For team-based games
  spectators?: Spectator[];          // For spectator support
  metadata: RoomMetadata;
}

interface Team {
  id: string;
  name: string;
  players: Player[];
  teamDeck: Card[];                  // Combined team deck
  score: number;
}

interface RoomMetadata {
  createdAt: Date;
  lastActivity: Date;
  isPrivate: boolean;
  password?: string;
  tags: string[];                    // For matchmaking
  skillLevel?: SkillLevel;          // For balanced matches
}
```

### 5. Socket Event Updates

```typescript
// Room type specific events
interface RoomTypeEvents {
  // Creation and joining
  'create-typed-room': {
    roomType: string;
    options: RoomCreationOptions;
  };
  
  'join-typed-room': {
    roomId: string;
    teamPreference?: string;         // For team games
  };
  
  // Team-specific events
  'team-message': {
    teamId: string;
    message: string;
  };
  
  'switch-team': {
    playerId: string;
    newTeamId: string;
  };
  
  // Super mode specific
  'use-power-card': {
    cardId: string;
    target: string;
  };
}
```

### 6. Matchmaking System

```typescript
class MatchmakingService {
  private queues: Map<string, MatchmakingQueue> = new Map();
  
  joinQueue(
    player: Player, 
    roomType: string, 
    preferences: MatchmakingPreferences
  ): void {
    const queue = this.getOrCreateQueue(roomType);
    queue.addPlayer(player, preferences);
    this.tryMatch(roomType);
  }
  
  private tryMatch(roomType: string): MatchResult | null {
    const queue = this.queues.get(roomType);
    if (!queue) return null;
    
    const config = RoomFactory.getRoomConfig(roomType);
    const candidates = queue.getCandidates(config.playerCount);
    
    if (candidates.length >= config.playerCount) {
      // Create room and notify players
      const room = RoomFactory.createRoom(
        roomType,
        this.generateRoomId(),
        candidates[0]
      );
      
      return {
        room,
        players: candidates
      };
    }
    
    return null;
  }
}
```

## Implementation Plan

### Phase 1: Core Architecture
1. Create base interfaces and abstract classes
2. Implement factory pattern for room creation
3. Update RoomManager to support typed rooms
4. Create room type configurations

### Phase 2: Classic Mode Refactor
1. Refactor existing game logic into ClassicGameRules
2. Ensure backward compatibility
3. Add room type to existing rooms

### Phase 3: Team 2v2 Implementation
1. Implement Team2v2GameRules
2. Add team formation logic
3. Create team-specific UI components
4. Add team communication features

### Phase 4: Super Mode Implementation
1. Implement SuperGameRules
2. Add larger card dealing logic
3. Create Super mode specific UI
4. Add complexity scoring

### Phase 5: Matchmaking & Polish
1. Implement matchmaking service
2. Add room browser with filters
3. Create room type selection UI
4. Add statistics per room type

## Benefits

1. **Scalability**: Easy to add new game modes
2. **Maintainability**: Clear separation of concerns
3. **Flexibility**: Each mode can have unique rules
4. **Reusability**: Shared core logic across modes
5. **Type Safety**: TypeScript ensures consistency

## Migration Strategy

1. Add roomType field to existing rooms (default: 'classic')
2. Gradually refactor existing logic into rules classes
3. Maintain backward compatibility during transition
4. Update clients to handle room types
5. Deploy with feature flags for gradual rollout
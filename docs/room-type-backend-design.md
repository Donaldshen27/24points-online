# Room Type Backend Architecture (No Database)

## Overview
This document outlines the backend changes needed to support multiple room types using in-memory configuration and TypeScript interfaces.

## Configuration Structure

### 1. Room Type Configurations
Store all room type configurations in code.

```typescript
// server/src/config/roomTypes.ts
export const ROOM_TYPE_CONFIGS: Record<string, RoomTypeConfig> = {
  classic: {
    id: 'classic',
    displayName: 'Classic 1v1',
    description: 'Traditional 2-player 24 points game',
    playerCount: 2,
    cardsPerPlayer: 10,
    cardsPerDraw: 2,
    teamBased: false,
    minPlayers: 2,
    maxPlayers: 2,
    rules: {
      turnTimeLimit: 120,
      solutionTimeLimit: 30,
      scoringSystem: 'classic',
      winCondition: 'no_cards',
      allowSpectators: false,
      requireExactMatch: true,
    },
    features: {
      hasTimer: true,
      hasChat: true,
      hasVoice: false,
      hasReplay: true,
      hasStatistics: true,
      hasTournamentMode: false,
    }
  },
  team2v2: {
    id: 'team2v2',
    displayName: 'Team Battle 2v2',
    description: 'Team-based 4-player game',
    playerCount: 4,
    cardsPerPlayer: 10,
    cardsPerDraw: 2,
    teamBased: true,
    minPlayers: 4,
    maxPlayers: 4,
    rules: {
      turnTimeLimit: 180,
      solutionTimeLimit: 45,
      scoringSystem: 'speed',
      winCondition: 'all_cards',
      allowSpectators: true,
      requireExactMatch: true,
    },
    features: {
      hasTimer: true,
      hasChat: true,
      hasVoice: true,
      hasReplay: true,
      hasStatistics: true,
      hasTournamentMode: true,
    }
  },
  super: {
    id: 'super',
    displayName: 'Super Mode',
    description: 'Advanced mode with 7 center cards',
    playerCount: 2,
    cardsPerPlayer: 14,
    cardsPerDraw: 7,
    teamBased: false,
    minPlayers: 2,
    maxPlayers: 2,
    rules: {
      turnTimeLimit: 150,
      solutionTimeLimit: 40,
      scoringSystem: 'complexity',
      winCondition: 'point_limit',
      winConditionValue: 100,
      allowSpectators: true,
      requireExactMatch: true,
    },
    features: {
      hasTimer: true,
      hasChat: true,
      hasVoice: false,
      hasReplay: true,
      hasStatistics: true,
      hasTournamentMode: true,
    }
  }
};
```

### 2. Enhanced Type Definitions

```typescript
// server/src/types/roomTypes.ts
export interface RoomTypeConfig {
  id: string;
  displayName: string;
  description: string;
  playerCount: number;
  cardsPerPlayer: number;
  cardsPerDraw: number;
  teamBased: boolean;
  minPlayers: number;
  maxPlayers: number;
  rules: RuleConfiguration;
  features: RoomFeatures;
}

export interface RuleConfiguration {
  turnTimeLimit: number;
  solutionTimeLimit: number;
  scoringSystem: 'classic' | 'speed' | 'complexity';
  winCondition: 'no_cards' | 'all_cards' | 'point_limit' | 'time_limit' | 'round_limit';
  winConditionValue?: number;
  allowSpectators: boolean;
  requireExactMatch: boolean;
}

export interface RoomFeatures {
  hasTimer: boolean;
  hasChat: boolean;
  hasVoice: boolean;
  hasReplay: boolean;
  hasStatistics: boolean;
  hasTournamentMode: boolean;
}

// Extend existing GameRoom interface
export interface TypedGameRoom extends GameRoom {
  roomType: string;
  config: RoomTypeConfig;
  teams?: Team[];
  spectators?: string[]; // Socket IDs of spectators
  metadata: {
    createdAt: Date;
    isPrivate: boolean;
    password?: string;
    tags?: string[];
  };
}

export interface Team {
  id: string;
  name: string;
  playerIds: string[];
  score: number;
  color?: string;
}
```

### 3. Updated RoomManager

```typescript
// server/src/socket/RoomManager.ts
import { ROOM_TYPE_CONFIGS } from '../config/roomTypes';
import { RoomFactory } from '../game/RoomFactory';

export class RoomManager {
  private rooms: Map<string, TypedGameRoom> = new Map();
  private gameManagers: Map<string, GameStateManager> = new Map();
  private playerToRoom: Map<string, string> = new Map();
  private io: Server | null = null;

  createRoom(
    playerId: string, 
    socketId: string, 
    playerName: string,
    roomType: string = 'classic',
    options?: RoomCreationOptions
  ): TypedGameRoom {
    const config = ROOM_TYPE_CONFIGS[roomType];
    if (!config) {
      throw new Error(`Invalid room type: ${roomType}`);
    }

    const roomId = this.generateRoomId();
    const room = RoomFactory.createRoom(roomType, roomId, {
      id: playerId,
      socketId,
      name: playerName,
      deck: [],
      isReady: false
    });

    // Apply optional settings
    if (options?.isPrivate) {
      room.metadata.isPrivate = true;
      room.metadata.password = options.password;
    }

    this.rooms.set(roomId, room);
    
    // Create appropriate game manager
    const GameManagerClass = this.getGameManagerClass(roomType);
    const gameManager = new GameManagerClass(room);
    this.setupGameManagerCallbacks(gameManager, roomId);
    this.gameManagers.set(roomId, gameManager);
    
    this.playerToRoom.set(socketId, roomId);
    
    return room;
  }

  private getGameManagerClass(roomType: string): typeof GameStateManager {
    switch (roomType) {
      case 'team2v2':
        return TeamGameStateManager;
      case 'super':
        return SuperGameStateManager;
      default:
        return GameStateManager;
    }
  }

  joinRoom(
    roomId: string, 
    playerId: string, 
    socketId: string, 
    playerName: string,
    teamPreference?: string
  ): TypedGameRoom | null {
    const room = this.rooms.get(roomId) as TypedGameRoom;
    
    if (!room) {
      return null;
    }

    // Check room capacity based on type
    if (room.players.length >= room.config.maxPlayers) {
      return null;
    }

    // Handle team assignment for team-based games
    if (room.config.teamBased && room.teams) {
      this.assignPlayerToTeam(room, playerId, teamPreference);
    }

    const player: Player = {
      id: playerId,
      socketId,
      name: playerName,
      deck: [],
      isReady: false
    };

    room.players.push(player);
    room.scores[playerId] = 0;
    this.playerToRoom.set(socketId, roomId);

    // Check if room can start
    if (room.players.length >= room.config.minPlayers) {
      room.state = GameState.WAITING; // Ready to start when all ready
    }

    return room;
  }

  private assignPlayerToTeam(room: TypedGameRoom, playerId: string, preference?: string): void {
    if (!room.teams || room.teams.length === 0) {
      // Initialize teams
      room.teams = [
        { id: 'team1', name: 'Team 1', playerIds: [], score: 0, color: '#FF6B6B' },
        { id: 'team2', name: 'Team 2', playerIds: [], score: 0, color: '#4ECDC4' }
      ];
    }

    // Find team with fewer players or use preference
    let targetTeam = room.teams[0];
    if (preference) {
      const prefTeam = room.teams.find(t => t.id === preference);
      if (prefTeam && prefTeam.playerIds.length < 2) {
        targetTeam = prefTeam;
      }
    } else {
      // Auto-balance teams
      targetTeam = room.teams.reduce((min, team) => 
        team.playerIds.length < min.playerIds.length ? team : min
      );
    }

    targetTeam.playerIds.push(playerId);
  }

  getRoomsByType(roomType?: string): TypedGameRoom[] {
    const rooms = Array.from(this.rooms.values()) as TypedGameRoom[];
    
    if (roomType) {
      return rooms.filter(room => room.roomType === roomType);
    }
    
    return rooms;
  }

  getOpenRoomsByType(roomType?: string): TypedGameRoom[] {
    return this.getRoomsByType(roomType).filter(room => {
      const hasSpace = room.players.length < room.config.maxPlayers;
      const hasDisconnected = room.players.some(p => !p.socketId);
      return hasSpace || hasDisconnected;
    });
  }

  // Enhanced matchmaking
  findMatch(
    player: Player, 
    roomType: string, 
    preferences?: MatchmakingPreferences
  ): TypedGameRoom | null {
    const openRooms = this.getOpenRoomsByType(roomType);
    
    // Filter by preferences
    let candidateRooms = openRooms;
    
    if (preferences?.skillLevel) {
      candidateRooms = candidateRooms.filter(room => 
        !room.metadata.tags || room.metadata.tags.includes(preferences.skillLevel)
      );
    }
    
    if (preferences?.isPrivate === false) {
      candidateRooms = candidateRooms.filter(room => !room.metadata.isPrivate);
    }
    
    // Return first suitable room or null
    return candidateRooms[0] || null;
  }
}
```

### 4. Game Rules Implementation

```typescript
// server/src/game/rules/BaseGameRules.ts
export abstract class BaseGameRules {
  constructor(protected config: RoomTypeConfig) {}
  
  abstract initializeDecks(players: Player[]): void;
  abstract dealCards(room: TypedGameRoom): Card[];
  abstract validateSolution(solution: Solution, centerCards: Card[]): boolean;
  abstract calculateScore(solution: Solution, timeElapsed: number): number;
  abstract checkWinCondition(room: TypedGameRoom): WinResult | null;
  
  // Common methods
  protected shuffleDeck(cards: Card[]): void {
    // Fisher-Yates shuffle
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
  }
}

// server/src/game/rules/ClassicGameRules.ts
export class ClassicGameRules extends BaseGameRules {
  initializeDecks(players: Player[]): void {
    players.forEach(player => {
      player.deck = [];
      for (let i = 1; i <= 10; i++) {
        player.deck.push({
          value: i,
          owner: player.id as any,
          id: `${player.id}-${i}`
        });
      }
      this.shuffleDeck(player.deck);
    });
  }
  
  dealCards(room: TypedGameRoom): Card[] {
    const centerCards: Card[] = [];
    
    room.players.forEach(player => {
      for (let i = 0; i < this.config.cardsPerDraw; i++) {
        const card = player.deck.pop();
        if (card) {
          centerCards.push(card);
        }
      }
    });
    
    return centerCards;
  }
  
  checkWinCondition(room: TypedGameRoom): WinResult | null {
    // Check if any player has no cards (wins)
    const winner = room.players.find(p => p.deck.length === 0);
    if (winner) {
      return { winnerId: winner.id, reason: 'no_cards' };
    }
    
    // Check if any player has all cards (loses)
    const loser = room.players.find(p => p.deck.length === 20);
    if (loser) {
      const winnerId = room.players.find(p => p.id !== loser.id)?.id;
      return { winnerId: winnerId!, reason: 'opponent_all_cards' };
    }
    
    return null;
  }
}

// server/src/game/rules/Team2v2GameRules.ts
export class Team2v2GameRules extends BaseGameRules {
  initializeDecks(players: Player[]): void {
    // Similar to classic but track team ownership
  }
  
  dealCards(room: TypedGameRoom): Card[] {
    // Each team contributes cards
    const centerCards: Card[] = [];
    
    room.teams?.forEach(team => {
      const teamPlayers = room.players.filter(p => 
        team.playerIds.includes(p.id)
      );
      
      teamPlayers.forEach(player => {
        const card = player.deck.pop();
        if (card) {
          centerCards.push(card);
        }
      });
    });
    
    return centerCards;
  }
  
  checkWinCondition(room: TypedGameRoom): WinResult | null {
    // Team-based win conditions
    if (!room.teams) return null;
    
    for (const team of room.teams) {
      const teamPlayers = room.players.filter(p => 
        team.playerIds.includes(p.id)
      );
      
      const totalCards = teamPlayers.reduce((sum, p) => sum + p.deck.length, 0);
      
      if (totalCards === 0) {
        return { winnerId: team.id, reason: 'team_no_cards', isTeam: true };
      }
      
      if (totalCards === 40) { // All cards
        const otherTeam = room.teams.find(t => t.id !== team.id);
        return { winnerId: otherTeam!.id, reason: 'opponent_team_all_cards', isTeam: true };
      }
    }
    
    return null;
  }
}
```

### 5. Socket Event Updates

```typescript
// server/src/socket/connectionHandler.ts
socket.on('create-room', (data: {
  playerName: string;
  roomType: string;
  options?: RoomCreationOptions;
}, callback) => {
  try {
    const playerId = generatePlayerId();
    const room = roomManager.createRoom(
      playerId, 
      socket.id, 
      data.playerName,
      data.roomType,
      data.options
    );
    
    socket.join(room.id);
    
    callback({
      success: true,
      room: {
        id: room.id,
        roomType: room.roomType,
        config: room.config,
        players: room.players,
        teams: room.teams,
        metadata: room.metadata
      },
      playerId
    });
  } catch (error) {
    callback({
      success: false,
      error: error.message
    });
  }
});

socket.on('get-room-types', (callback) => {
  const roomTypes = Object.values(ROOM_TYPE_CONFIGS).map(config => ({
    id: config.id,
    displayName: config.displayName,
    description: config.description,
    playerCount: config.playerCount,
    teamBased: config.teamBased,
    features: config.features
  }));
  
  callback(roomTypes);
});

socket.on('find-match', (data: {
  roomType: string;
  preferences?: MatchmakingPreferences;
}, callback) => {
  const room = roomManager.findMatch(
    getCurrentPlayer(socket.id),
    data.roomType,
    data.preferences
  );
  
  if (room) {
    // Join the found room
    const result = roomManager.joinRoom(
      room.id,
      playerId,
      socket.id,
      playerName
    );
    
    callback({
      success: true,
      roomId: room.id
    });
  } else {
    // Create new room for matchmaking
    const newRoom = roomManager.createRoom(
      playerId,
      socket.id,
      playerName,
      data.roomType
    );
    
    callback({
      success: true,
      roomId: newRoom.id,
      created: true
    });
  }
});

// Team-specific events
socket.on('switch-team', (data: { teamId: string }, callback) => {
  const room = roomManager.getRoomBySocketId(socket.id) as TypedGameRoom;
  
  if (room?.config.teamBased && room.teams) {
    const player = room.players.find(p => p.socketId === socket.id);
    if (player) {
      roomManager.switchPlayerTeam(room.id, player.id, data.teamId);
      io.to(room.id).emit('team-updated', { teams: room.teams });
      callback({ success: true });
    }
  }
});
```

## Benefits of This Approach

1. **No Database Dependency**: All configuration in code
2. **Type Safety**: Full TypeScript support
3. **Easy to Deploy**: No schema migrations
4. **Performance**: No database queries
5. **Simplicity**: Easier to understand and modify

## Future Enhancements

1. **Configuration File**: Move configs to JSON/YAML files
2. **Hot Reload**: Support config changes without restart
3. **A/B Testing**: Easy to test new room types
4. **Feature Flags**: Enable/disable room types dynamically
5. **Analytics**: Track room type usage in-memory
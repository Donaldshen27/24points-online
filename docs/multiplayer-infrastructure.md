# Multiplayer Infrastructure Documentation

## Overview
The multiplayer infrastructure for the 24 Points game enables real-time communication between players using Socket.io.

## Architecture

### Server-Side Components

#### RoomManager (`server/src/socket/RoomManager.ts`)
Manages game rooms and player assignments:
- **Room Creation**: Generates unique room IDs and creates new game rooms
- **Room Joining**: Handles players joining existing rooms
- **Player Management**: Tracks player-to-room mappings
- **State Management**: Updates room states based on player actions

#### Connection Handler (`server/src/socket/connectionHandler.ts`)
Handles all socket events:
- `create-room`: Creates a new game room
- `join-room`: Joins an existing room
- `leave-room`: Leaves the current room
- `player-ready`: Updates player ready status
- `get-rooms`: Retrieves list of open rooms
- `disconnect`: Handles player disconnection

### Client-Side Components

#### Socket Service (`client/src/services/socketService.ts`)
Singleton service managing WebSocket connection:
- Connection management
- Event registration and emission
- Error handling

#### Lobby Component (`client/src/components/Lobby/Lobby.tsx`)
Main menu interface for:
- Creating new rooms
- Joining existing rooms
- Viewing available rooms
- Entering player name

#### Waiting Room Component (`client/src/components/WaitingRoom/WaitingRoom.tsx`)
Pre-game interface showing:
- Room code
- Player ready states
- Countdown timer
- Leave room option

## Game Flow

1. **Connection**: Player connects to server via WebSocket
2. **Lobby**: Player enters name and either creates or joins a room
3. **Waiting Room**: Players ready up and wait for game start
4. **Game Start**: When both players are ready, countdown begins
5. **In Game**: Game state (placeholder for now)

## Socket Events

### Client → Server
- `create-room`: `{ playerName: string }`
- `join-room`: `{ roomId: string, playerName: string }`
- `leave-room`: `{}`
- `player-ready`: `{ isReady: boolean }`
- `get-rooms`: `{}`

### Server → Client
- `room-created`: `{ room: GameRoom, playerId: string }`
- `room-joined`: `{ room: GameRoom, playerId: string }`
- `room-updated`: `GameRoom`
- `rooms-updated`: `GameRoom[]`
- `rooms-list`: `GameRoom[]`
- `game-starting`: `{ countdown: number }`
- `join-room-error`: `{ message: string }`
- `player-left`: `{ socketId: string }`
- `player-disconnected`: `{ socketId: string }`

## Data Types

```typescript
interface GameRoom {
  id: string;
  players: Player[];
  state: GameState;
  centerCards: Card[];
  currentRound: number;
  scores: { [playerId: string]: number };
}

interface Player {
  id: string;
  socketId: string;
  name: string;
  deck: Card[];
  isReady: boolean;
}

enum GameState {
  WAITING = 'waiting',
  PLAYING = 'playing',
  SOLVING = 'solving',
  ROUND_END = 'round_end',
  GAME_OVER = 'game_over'
}
```

## Security Considerations
- Room IDs are randomly generated 6-character codes
- Player IDs include timestamp and random components
- Server validates all player actions
- Rooms are automatically cleaned up when empty
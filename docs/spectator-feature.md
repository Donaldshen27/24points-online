# Spectator Feature Documentation

## Overview
The spectator feature allows users to watch ongoing 24 Points games in real-time. Spectators can toggle between viewing the game from either player's perspective and see the game state as it unfolds.

## Features

### 1. Spectate Button in Lobby
- A purple "👁️ SPECTATE" button appears under each active game room in the lobby
- Only visible for rooms in playing, solving, or round_end states
- Clicking the button immediately connects the user as a spectator

### 2. Spectator View Interface
- **Header Controls**:
  - Toggle buttons to switch between Player 1 and Player 2 perspectives
  - Live spectator count display
  - Leave button to return to lobby

- **Game Display**:
  - Shows the selected player's perspective at the bottom (like they would see it)
  - Displays opponent's hand at the top
  - Center table shows the current game state with cards
  - All interactions are disabled for spectators

- **Battle Statistics**:
  - Real-time card count for each player
  - Current scores
  - Connection status indicators
  - Highlights which player's perspective is being viewed

### 3. Real-time Updates
- Game state updates are broadcast to all spectators
- Spectator count is updated when spectators join/leave
- All game events (round start, solutions, game over) are shown

## Technical Implementation

### Client-Side

#### New Components:
- `SpectatorView.tsx` - Main spectator interface component
- `SpectatorView.css` - Styling for spectator mode

#### Modified Components:
- `Lobby.tsx` - Added spectate button to room cards
- `App.tsx` - Added spectator state and routing
- `PlayerHand.tsx` - Added spectator view support

#### Socket Events (Client):
- `spectate-room` - Request to spectate a room
- `leave-spectator` - Leave spectator mode
- `spectator-joined` - Confirmation of joining as spectator
- `spectator-room-updated` - Game state updates for spectators
- `spectator-count-updated` - Updates to spectator count
- `spectate-error` - Error when spectating fails

### Server-Side

#### Modified Files:
- `connectionHandler.ts` - Added spectator event handlers
- `RoomManager.ts` - Added spectator tracking Map

#### Socket Events (Server):
- Handles spectator join/leave requests
- Validates spectator permissions (room must allow spectators)
- Broadcasts game state to spectator rooms
- Manages spectator cleanup on disconnect

#### Spectator Management:
- Spectators are tracked in a Map: `roomId -> Set<socketId>`
- Spectators join a separate socket.io room: `spectators-${roomId}`
- Game state updates are broadcast to both players and spectators
- Automatic cleanup when spectators disconnect

## Room Configuration

Spectator support is controlled by room configuration:
```typescript
rules: {
  allowSpectators: boolean
}
```

Currently, the classic room type has `allowSpectators: false` by default, but this can be changed in the room configuration.

## Security Considerations

1. **Read-only Access**: Spectators cannot interact with the game
2. **State Validation**: Only active games can be spectated
3. **Permission Check**: Rooms must have spectator support enabled
4. **No Sensitive Data**: Spectators see the same sanitized game state as players

## Future Enhancements

1. **Player Action Streaming**: Show real-time card selections and operations as players interact
2. **Replay Controls**: Allow spectators to review previous rounds
3. **Chat Integration**: Spectator-only chat room
4. **Tournament Mode**: Special spectator features for tournament games
5. **Statistics Dashboard**: Enhanced real-time statistics and analytics

## Usage

1. Start a game between two players
2. From the lobby, other users will see a "SPECTATE" button under active games
3. Click to enter spectator mode
4. Use the toggle buttons to switch between player perspectives
5. Click "Leave" to return to the lobby

The spectator feature enhances the 24 Points game by allowing others to watch and learn from ongoing matches, making it more engaging for the community.
# 24 Points Arcade Game - Project Requirements

## Game Overview
A real-time multiplayer card game where two players race to solve mathematical puzzles by combining 4 cards to reach exactly 24 using arithmetic operations.

## Core Game Rules
- Each player starts with a deck of cards numbered 1-10
- Each round, both players draw 2 cards face-up to a shared center table (4 cards total)
- Players race to find a solution using all 4 cards exactly once
- First player to press "I know it!" gets to attempt the solution
- If correct, the loser takes all 4 cards back to their deck
- If incorrect, the attempting player takes all 4 cards
- Game ends when one player runs out of cards (winner) or has all 20 cards (loser)

## Technical Architecture
- **Frontend**: React with TypeScript, real-time WebSocket connection
- **Backend**: Node.js with Express and Socket.io for multiplayer
- **Game Logic**: Shared validation logic between client and server
- **UI/UX**: Smooth animations, drag-and-drop or click-based card interactions

## Key Features
1. **Real-time Multiplayer**: Two players connected via WebSocket
2. **Answer Interface**: Step-by-step solution building with operation selection
3. **Validation System**: Server-side verification of 24-point solutions
4. **Animations**: Card dealing, movement, and victory/defeat effects
5. **Game States**: Lobby, playing, solving, round-end, game-over
6. **Player Stats**: Win/loss tracking and scoring system

## Development Phases
1. **Core Infrastructure**: React/Node.js setup with Socket.io
2. **Game Logic**: Card system and 24-point calculation engine
3. **Core Gameplay**: Round system and answer screen
4. **UI/UX**: Game board layout and animations
5. **Real-time Sync**: Socket events and state reconciliation
6. **Polish**: Sound effects, profiles, and tutorial
7. **Testing**: Unit tests, integration tests, and optimization

## Technical Considerations
- Client-side prediction with server reconciliation for low latency
- All calculations validated server-side to prevent cheating
- Responsive design for desktop and mobile support
- Horizontal scaling capability for multiplayer rooms
- Browser compatibility across major browsers

## Project Structure
```
src/                    # React frontend
├── components/         # UI components
├── hooks/             # Custom React hooks
├── utils/             # Game logic utilities
└── services/          # Socket service

server/                # Node.js backend
├── socket/            # Socket.io handlers
├── game/              # Game engine
└── utils/             # Shared utilities
```

## Task Tracking
Tasks are managed through the MCP task coordination system with IDs following the pattern: 24points-X.Y where X is the phase number and Y is the task number within that phase.
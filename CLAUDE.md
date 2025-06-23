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
- **Frontend**: React 18 with TypeScript, Vite build tool, Socket.io-client, i18next for internationalization
- **Backend**: Node.js with Express, TypeScript, Socket.io for WebSocket connections
- **Game Logic**: Shared validation logic between client and server with comprehensive calculator utilities
- **UI/UX**: Framer Motion animations, drag-and-drop card interactions, responsive design
- **Deployment**: Frontend on Netlify (twentyfourpoints.com), Backend configured for Render

## Key Features
1. **Real-time Multiplayer**: Two players connected via WebSocket with spectator mode
2. **Answer Interface**: Step-by-step solution building with keyboard shortcuts
3. **Validation System**: Server-side verification with multiple solution algorithms
4. **Animations**: Card dealing, transitions, victory celebrations, solution replay
5. **Game States**: Lobby, playing, solving, round-end, game-over with statistics
6. **Player Stats**: Win/loss tracking, solution replays, and performance metrics
7. **Game Modes**: Classic 1v1, Super Mode (8 cards), Extended Range (1-20), Solo Practice
8. **Internationalization**: English and Chinese language support
9. **Mobile Support**: Fully responsive design with touch controls
10. **Network Resilience**: Disconnect/reconnect handling

## Development Status (Completed)
1. **✅ Core Infrastructure**: React/TypeScript/Vite frontend, Node.js/Express backend
2. **✅ Game Logic**: Complete card system with deck management and validation
3. **✅ Core Gameplay**: Round system, solution builder, win/loss conditions
4. **✅ UI/UX**: Responsive layout, animations, drag-and-drop, keyboard controls
5. **✅ Real-time Sync**: WebSocket events with state reconciliation
6. **✅ Advanced Features**: Multiple game modes, spectator support, replay system
7. **✅ Production**: Deployed and live at twentyfourpoints.com

## Technical Considerations
- Client-side prediction with server reconciliation for low latency
- All calculations validated server-side to prevent cheating
- Responsive design for desktop and mobile support
- Horizontal scaling capability for multiplayer rooms
- Browser compatibility across major browsers

## Project Structure
```
client/                 # React frontend (Vite)
├── src/
│   ├── components/     # UI components (GameScreen, InteractiveCenterTable, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Game logic utilities
│   ├── services/       # Socket service
│   └── i18n/           # Internationalization

server/                 # Node.js backend
├── src/
│   ├── socket/         # Socket.io handlers
│   ├── game/           # Game engine and room management
│   └── utils/          # Server utilities

shared/                 # Shared types and logic
├── calculator/         # 24-point calculation algorithms
└── types/              # TypeScript type definitions

docs/                   # Comprehensive documentation
```

## Recent Updates
- Solo practice mode with auto-skip and faster replay
- Mobile UI optimization with minimalist design
- Google AdSense integration
- React StrictMode compatibility fixes
- Network optimization for rapid reconnections
- SEO improvements for better search rankings

## Game Modes
1. **Classic 1v1**: Traditional 2-player game with 4 cards (2 from each player)
2. **Super Mode (7倍圣水)**: Advanced mode with 8 center cards
3. **Extended Range**: Cards from 1-20 instead of 1-10
4. **Solo Practice**: Single-player training mode with solution replay

## Task Tracking
Tasks are managed through the MCP task coordination system with IDs following the pattern: 24points-X.Y where X is the phase number and Y is the task number within that phase.

## Organizational Guidelines
- Documentation should go to appropriate docs subfolders
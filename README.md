# 24 Points Arcade Game

A real-time multiplayer card game where two players race to solve mathematical puzzles.

## Project Structure

```
online24points/
├── client/          # React TypeScript frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # Socket.io service
│   │   └── utils/        # Utility functions
│   └── package.json
├── server/          # Node.js backend
│   ├── src/
│   │   ├── socket/       # Socket.io handlers
│   │   ├── game/         # Game logic
│   │   └── utils/        # Shared utilities
│   └── package.json
└── README.md
```

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install server dependencies:
```bash
cd server
npm install
```

2. Install client dependencies:
```bash
cd client
npm install
```

### Running the Application

1. Start the server (in the server directory):
```bash
npm run dev
```

2. Start the client (in the client directory):
```bash
npm run dev
```

The server will run on http://localhost:3001 and the client on http://localhost:5173

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Socket.io-client for real-time communication

### Backend
- Node.js with Express
- TypeScript
- Socket.io for WebSocket connections
- Nodemon for development

## Game Rules

1. Each player starts with cards numbered 1-10
2. Each round, both players draw 2 cards to a shared center (4 total)
3. Players race to find a solution using all 4 cards to reach 24
4. First to press "I know it!" attempts the solution
5. Correct answer: opponent takes all cards
6. Wrong answer: you take all cards
7. Game ends when a player runs out of cards (wins) or has all 20 (loses)
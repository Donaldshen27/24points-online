# 24 Points Online - Multiplayer Card Game

A real-time multiplayer card game where two players race to solve mathematical puzzles by combining 4 cards to reach exactly 24 using arithmetic operations.

🎮 **Play Now**: 
- https://twentyfourpoints.com
- https://verdant-flan-eeb30e.netlify.app/

## 🎮 Game Features

- **Real-time Multiplayer**: Two players compete in real-time via WebSocket connections
- **Fair Gameplay**: Advanced card validation ensures every round has at least one valid solution
- **Auto-balancing**: Cards automatically redistribute based on who solves each round
- **Network Play**: Accessible on local network for multiplayer gaming across devices
- **Responsive Design**: Works on desktop and mobile browsers
- **Simplified UI**: Players see only their card count, not the actual cards in hand

## 📁 Project Structure

```
online24points/
├── client/              # React TypeScript frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # Socket.io service
│   │   └── utils/       # Utility functions
│   └── package.json
├── server/              # Node.js backend
│   ├── src/
│   │   ├── socket/      # Socket.io handlers
│   │   ├── game/        # Game engine & logic
│   │   ├── types/       # TypeScript types
│   │   └── utils/       # Shared utilities
│   └── package.json
├── shared/              # Shared game logic
│   └── game/
│       ├── calculator.ts     # Solution validation
│       └── __tests__/        # Unit tests
├── docs/                # Documentation (organized by category)
│   ├── architecture/    # System design & game logic
│   ├── authentication/  # Auth system documentation
│   ├── badges/          # Achievement system docs
│   ├── features/        # Game features & modes
│   ├── infrastructure/  # Deployment & backend
│   ├── bug-fixes/       # Bug fix documentation
│   ├── ui-ux/           # Interface & interaction
│   └── plans/           # Future feature plans
├── COMPLETED_WORK.md    # Log of completed features
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone git@github.com:Donaldshen27/24points-online.git
cd 24points-online
```

2. Install all dependencies:
```bash
npm run install:all
```

3. Set up environment variables:
```bash
# Create .env file in server directory
cd server
cp .env.example .env  # If example exists, otherwise create new
```

4. Configure Supabase (if using database features):
   - Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to server/.env
   - Run database migrations (see Database Setup below)

### Database Setup

The game supports optional database features for rankings, badges, and statistics:

1. **Run migrations** in Supabase SQL Editor:
   ```sql
   -- Option 1: Run all ELO migrations at once
   -- Copy contents of server/migrations/elo_combined_migration.sql
   
   -- Option 2: Run individual migrations in order
   -- Files in server/migrations/ numbered sequentially
   ```

2. **Verify migration status**:
   ```bash
   cd server
   node scripts/check-elo-migrations.js
   ```

3. **Common migrations**:
   - Core game tables: `schema.sql`
   - Badge system: `002_badge_system.sql`
   - Authentication: `003_auth_system.sql`
   - ELO rankings: `elo_combined_migration.sql`

### Running the Application

#### Development Mode
Run both client and server concurrently:
```bash
npm run dev
```

Or run them separately:
```bash
# Terminal 1 - Server
cd server && npm run dev

# Terminal 2 - Client  
cd client && npm run dev
```

#### Local Network Access
The game automatically enables local network access:
- Frontend: `http://<your-ip>:5173`
- Backend: `http://<your-ip>:3024`

For WSL users, additional Windows firewall configuration may be required (see docs).

### Default Ports
- Client: http://localhost:5173
- Server: http://localhost:3024

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for lightning-fast builds
- **Socket.io-client** for real-time communication
- **Tailwind CSS** for styling (planned)

### Backend
- **Node.js** with Express 5
- **TypeScript** for type safety
- **Socket.io** for WebSocket connections
- **Custom game engine** with validation system

## 🎯 Game Rules

1. **Setup**: Each player starts with a deck of cards numbered 1-10 (2 copies each)
2. **Round Start**: Both players draw 2 cards face-up to a shared center (4 cards total)
3. **Objective**: Race to find a way to combine all 4 cards using +, -, ×, ÷ to reach exactly 24
4. **Claiming**: First player to press "I know it!" gets to attempt the solution
5. **Scoring**:
   - ✅ Correct answer → Opponent takes all 4 cards
   - ❌ Wrong answer → You take all 4 cards
6. **Winning Conditions**:
   - 🏆 Run out of cards (you win!)
   - 💀 Collect all 20 cards (you lose!)

## 🔧 Advanced Features

### Card Validation System
- **Pre-deal validation**: Ensures dealt cards have valid solutions
- **Post-deal verification**: Double-checks and redeals if needed
- **Automatic redealing**: Transparent notifications when cards are reshuffled
- **Solution checker**: Validates all permutations and operation combinations

### Network Play
- **Auto-discovery**: Clients automatically connect to the correct backend
- **CORS support**: Configured for local network play
- **WSL compatibility**: Special configuration for Windows Subsystem for Linux

### Recent Updates
- **Victory Celebration**: Glorious animation when you solve 24 points correctly
- **Simplified Card Display**: Players now see only card counts instead of actual cards in hand for cleaner UI
- **Interactive Calculator**: Drag and combine cards to create expressions and find solutions

## 📚 Documentation

- [Card Validation System](docs/card-validation-system.md) - How the solution validation works
- [Network Setup Guide](docs/network-setup.md) - Configure for LAN play (coming soon)
- [Game Architecture](docs/architecture.md) - Technical design overview (coming soon)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
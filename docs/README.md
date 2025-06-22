# 24 Points Game Documentation

This directory contains all technical documentation for the 24 Points game project, organized by category.

## 📁 Folder Structure

### 🔐 `/authentication`
Documentation related to the user authentication system, including:
- API endpoint specifications
- Authentication implementation details
- JWT token management
- Guest user handling
- Registration fixes

### 🏆 `/badges`
Comprehensive documentation for the badge/achievement system:
- Badge definitions and requirements
- Database schema and implementation
- Frontend components and displays
- Internationalization (i18n) support
- Various bug fixes and improvements

### 🎮 `/features`
Documentation for game features and modes:
- Game modes (Super Mode, Extended Range)
- Spectator system
- Puzzle records and leaderboards
- Solution replay functionality
- Enhanced game-over screens
- Patch notes system

### 🏗️ `/infrastructure`
Backend infrastructure and deployment documentation:
- Database setup (Supabase/PostgreSQL)
- Deployment guides (Netlify, Render)
- SEO optimization
- Multiplayer infrastructure
- Production troubleshooting

### 🐛 `/bug-fixes`
Documentation of various bug fixes and solutions:
- Animation fixes
- UI/UX fixes
- Socket reconnection issues
- Replay synchronization
- Solution submission fixes

### 🎨 `/ui-ux`
User interface and experience documentation:
- Game board layouts
- Interaction design patterns
- Keyboard controls
- Answer screen design
- Direct interaction UX

### 📋 `/plans`
Implementation plans for future features:
- 2v2 team mode
- Elo ranking system
- Room sharing functionality

### 🏛️ `/architecture`
System architecture and design documentation:
- Game state management
- Card system design
- Calculation engine
- Room type architecture
- Validation systems
- Round system logic

## 📝 Key Documents

### Recently Completed Features
- **Authentication System**: See `/authentication/authentication.md`
- **Badge System**: See `/badges/badge-system-implementation-plan.md`
- **Completed Work Log**: See `../COMPLETED_WORK.md`

### Core Architecture
- **Game Logic**: `/architecture/game-state-management.md`
- **Multiplayer**: `/infrastructure/multiplayer-infrastructure.md`
- **Database**: `/infrastructure/database-implementation.md`

### Quick Start Guides
- **Backend Deployment**: `/infrastructure/backend-deployment.md`
- **Frontend Deployment**: `/infrastructure/netlify-deployment.md`
- **Database Setup**: `/infrastructure/supabase-setup.md`

## 🔍 Finding Documentation

To find specific documentation:
1. Check the relevant folder based on the topic
2. Look for implementation plans (`*-plan.md`) for feature overviews
3. Check bug-fixes folder for specific issue resolutions
4. Review architecture folder for system design details

## 📅 Documentation Standards

When adding new documentation:
1. Place it in the appropriate category folder
2. Use descriptive filenames with hyphens (e.g., `feature-name-description.md`)
3. Include a header with overview and date
4. Add to this README if it's a major feature

## 🚀 Latest Updates

- **Authentication System**: Complete with JWT tokens and user management
- **Badge System**: 50+ badges with full i18n support
- **Documentation Reorganization**: All docs now properly categorized (2025-06-22)
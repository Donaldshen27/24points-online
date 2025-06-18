# ELO Ranking System Implementation Plan

## Overview
Implement a competitive ranking system for 24 Points using ELO ratings, enabling skill-based matchmaking, progression tracking, and competitive seasons. The system will provide fair matches, meaningful progression, and recognition for skilled players.

## System Architecture

### Core Components

1. **ELO Rating Engine**
   - Base ELO rating: 1200 (new players)
   - K-factor variations based on games played
   - Rating floor: 400 (prevent negative ratings)
   - Rating ceiling: 3000+ (no hard cap)

2. **Ranking Tiers**
   ```
   Grandmaster: 2400+ (Top 0.1%)
   Master:      2200-2399 (Top 0.5%)
   Diamond:     2000-2199 (Top 2%)
   Platinum:    1800-1999 (Top 8%)
   Gold:        1600-1799 (Top 20%)
   Silver:      1400-1599 (Top 40%)
   Bronze:      1200-1399 (Top 70%)
   Iron:        400-1199  (Bottom 30%)
   ```

3. **Database Schema**
   ```sql
   -- Player ratings table
   player_ratings (
     user_id: UUID PRIMARY KEY REFERENCES users(id),
     current_rating: INTEGER DEFAULT 1200,
     peak_rating: INTEGER DEFAULT 1200,
     games_played: INTEGER DEFAULT 0,
     wins: INTEGER DEFAULT 0,
     losses: INTEGER DEFAULT 0,
     win_streak: INTEGER DEFAULT 0,
     loss_streak: INTEGER DEFAULT 0,
     last_game_at: TIMESTAMP,
     placement_matches_remaining: INTEGER DEFAULT 10,
     created_at: TIMESTAMP,
     updated_at: TIMESTAMP
   )

   -- Seasonal ratings
   seasonal_ratings (
     id: UUID PRIMARY KEY,
     user_id: UUID REFERENCES users(id),
     season_id: INTEGER REFERENCES seasons(id),
     starting_rating: INTEGER,
     current_rating: INTEGER,
     peak_rating: INTEGER,
     games_played: INTEGER,
     wins: INTEGER,
     losses: INTEGER,
     final_rank: INTEGER,
     rewards_claimed: BOOLEAN DEFAULT false,
     UNIQUE(user_id, season_id)
   )

   -- Seasons table
   seasons (
     id: SERIAL PRIMARY KEY,
     name: VARCHAR(100),
     start_date: TIMESTAMP,
     end_date: TIMESTAMP,
     is_active: BOOLEAN DEFAULT false
   )

   -- Match history
   ranked_matches (
     id: UUID PRIMARY KEY,
     player1_id: UUID REFERENCES users(id),
     player2_id: UUID REFERENCES users(id),
     winner_id: UUID REFERENCES users(id),
     player1_rating_before: INTEGER,
     player2_rating_before: INTEGER,
     player1_rating_after: INTEGER,
     player2_rating_after: INTEGER,
     rating_change: INTEGER,
     match_duration: INTEGER, -- seconds
     rounds_played: INTEGER,
     player1_rounds_won: INTEGER,
     player2_rounds_won: INTEGER,
     season_id: INTEGER REFERENCES seasons(id),
     created_at: TIMESTAMP
   )

   -- Matchmaking queue
   matchmaking_queue (
     user_id: UUID PRIMARY KEY REFERENCES users(id),
     rating: INTEGER,
     queue_time: TIMESTAMP,
     search_range: INTEGER DEFAULT 50, -- widens over time
     region: VARCHAR(10),
     game_mode: VARCHAR(20) DEFAULT 'classic'
   )

   -- Leaderboards (cached)
   leaderboard_cache (
     rank: INTEGER PRIMARY KEY,
     user_id: UUID REFERENCES users(id),
     rating: INTEGER,
     games_played: INTEGER,
     win_rate: DECIMAL(5,2),
     region: VARCHAR(10),
     last_updated: TIMESTAMP
   )
   ```

### ELO Calculation Formula

```typescript
interface ELOCalculation {
  calculateNewRatings(
    winnerRating: number,
    loserRating: number,
    winnerGamesPlayed: number,
    loserGamesPlayed: number
  ): { winnerNew: number, loserNew: number };
}

// Standard ELO formula with modifications
function calculateELO(winner: number, loser: number): [number, number] {
  // Expected scores
  const expectedWinner = 1 / (1 + Math.pow(10, (loser - winner) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winner - loser) / 400));
  
  // K-factor based on games played
  const getKFactor = (gamesPlayed: number): number => {
    if (gamesPlayed < 10) return 40;  // Placement matches
    if (gamesPlayed < 30) return 30;  // New players
    if (gamesPlayed < 100) return 20; // Regular players
    return 15; // Experienced players
  };
  
  const kWinner = getKFactor(winnerGamesPlayed);
  const kLoser = getKFactor(loserGamesPlayed);
  
  // Calculate new ratings
  const winnerNew = winner + kWinner * (1 - expectedWinner);
  const loserNew = loser + kLoser * (0 - expectedLoser);
  
  return [Math.round(winnerNew), Math.round(loserNew)];
}
```

### Matchmaking Algorithm

```typescript
interface MatchmakingCriteria {
  rating: number;
  queueTime: number;
  searchRange: number;
}

// Progressive search expansion
function findMatch(player: MatchmakingCriteria): Player | null {
  // Initial tight range
  let range = 50;
  
  // Expand range based on queue time
  if (player.queueTime > 10) range = 100;
  if (player.queueTime > 30) range = 200;
  if (player.queueTime > 60) range = 400;
  if (player.queueTime > 120) range = 600;
  
  // Find opponents within range
  const minRating = player.rating - range;
  const maxRating = player.rating + range;
  
  // Prioritize closest rating match
  return findClosestRatingMatch(minRating, maxRating);
}
```

## Feature Implementation

### Phase 1: Core ELO System (elo-1.x, elo-2.x)
1. **Rating Calculations**
   - Implement ELO formula with K-factor adjustments
   - Handle edge cases (very high/low ratings)
   - Create rating update service

2. **Matchmaking Engine**
   - Queue management system
   - Progressive search expansion
   - Region-based matching
   - Fair match prevention (recent opponents)

3. **Rank Tiers**
   - Visual rank badges and borders
   - Promotion/demotion thresholds
   - Rank protection for new tiers

### Phase 2: Ranked Game Mode (elo-3.x)
1. **Game Mode Separation**
   - Ranked vs Casual queues
   - Ranked-specific rules (no rematch)
   - Stricter disconnect penalties

2. **Match History**
   - Detailed match records
   - Performance analytics
   - Replay system integration

### Phase 3: User Interface (elo-4.x)
1. **Ranked Lobby**
   - Queue status and estimated wait time
   - Rank display with progress bar
   - Recent match results

2. **Leaderboards**
   - Global top 100
   - Regional rankings
   - Friends leaderboard
   - Filtering by tier

3. **Player Profiles**
   - Rank history graph
   - Statistics dashboard
   - Match history with replays
   - Achievements and badges

### Phase 4: Seasonal System (elo-5.x)
1. **Season Structure**
   - 3-month seasons
   - Soft reset (compression toward 1500)
   - Placement matches (10 games)
   - Season rewards based on peak rank

2. **Integrity Features**
   - Disconnect penalties (-30 rating, timeout)
   - Win-trading detection
   - Smurf account prevention
   - Report system for unsportsmanlike behavior

### Phase 5: Optimization (elo-6.x)
1. **Performance**
   - Redis caching for leaderboards
   - Efficient database queries
   - Real-time rating updates via WebSocket

2. **Balancing**
   - Rating distribution analysis
   - Match quality metrics
   - Queue time optimization
   - Regional balancing

## Technical Specifications

### API Endpoints
```typescript
// Ranking endpoints
GET    /api/ranking/stats/:userId        // Player ranking stats
GET    /api/ranking/history/:userId      // Match history
GET    /api/ranking/leaderboard          // Global leaderboard
GET    /api/ranking/leaderboard/:region  // Regional leaderboard
POST   /api/ranking/queue/join           // Join ranked queue
POST   /api/ranking/queue/leave          // Leave ranked queue
GET    /api/ranking/queue/status         // Queue status

// Season endpoints
GET    /api/seasons/current              // Current season info
GET    /api/seasons/history/:userId      // Player season history
POST   /api/seasons/rewards/claim        // Claim season rewards
```

### WebSocket Events
```typescript
// Matchmaking events
'ranked:queue:joined'         // Confirmed queue entry
'ranked:queue:status'         // Queue status update
'ranked:match:found'          // Match found
'ranked:match:canceled'       // Match canceled

// Rating events
'ranked:rating:updated'       // Rating change notification
'ranked:tier:changed'         // Promotion/demotion
'ranked:leaderboard:updated'  // Leaderboard changes
```

### Matchmaking Flow
```
1. Player joins ranked queue
2. System checks eligibility (placement matches, penalties)
3. Initial search with tight rating range
4. Progressive expansion based on queue time
5. Match found → Create ranked room
6. Game completion → Update ratings
7. Post-game → Show rating changes
```

## User Experience Features

### Placement Matches
- First 10 games determine initial rating
- Accelerated rating changes
- Match with similar placement players
- Estimated rank shown after 5 games

### Progression Feedback
- Real-time rating change animations
- Progress bar to next tier
- Win/loss streak indicators
- Performance trends

### Competitive Integrity
- One account per player enforcement
- Minimum games for leaderboard (20)
- Decay system for inactive players
- Fair play guidelines

## Season Rewards
Based on peak rating achieved:
- **Grandmaster**: Exclusive avatar border, title, profile badge
- **Master**: Animated avatar border, title
- **Diamond**: Special avatar border, title
- **Platinum**: Avatar border
- **Gold**: Profile badge
- **Silver**: Participation reward
- **Bronze**: Participation reward

## Success Metrics
1. **Match Quality**: <200 rating difference average
2. **Queue Times**: <30s for 80% of players
3. **Rating Distribution**: Bell curve centered at 1500
4. **Player Retention**: 60%+ ranked players active weekly
5. **Fair Matches**: <5% rating manipulation reports

## Implementation Timeline
- Phase 1 (Core ELO): 3-4 days
- Phase 2 (Ranked Mode): 2-3 days
- Phase 3 (UI/UX): 3-4 days
- Phase 4 (Seasons): 2-3 days
- Phase 5 (Optimization): 2 days

**Total: 12-16 days**

## Future Enhancements
1. **Team Ranked** - 2v2 competitive mode
2. **Tournaments** - Scheduled competitive events
3. **Spectator Mode** - Watch high-ranked games
4. **Coaching System** - Higher ranks help lower ranks
5. **Advanced Analytics** - Detailed performance metrics
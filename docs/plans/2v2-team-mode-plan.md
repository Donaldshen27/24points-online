# 2v2 Team Mode Implementation Plan

## Overview
Implement a 2v2 team game mode for 24 Points where two teams of two players compete. Each player contributes 2 cards to create an 8-card center table, and teams collaborate to find solutions. This mode emphasizes teamwork, communication, and strategic coordination.

## Game Rules & Mechanics

### Core 2v2 Rules
1. **Team Formation**: 2 teams of 2 players each
2. **Card Distribution**: Each player draws 2 cards → 8 cards total on center table
3. **Turn System**: Teams alternate who can claim "I know it!"
4. **Solution Building**: Either teammate can build the solution after claiming
5. **Card Penalties**: Losing team splits the 8 cards (4 each)
6. **Win Condition**: Team wins when both opponents run out of cards
7. **Communication**: Team chat allowed during rounds (not during solution building)

### Team Dynamics
- **Shared Victory**: Both teammates win/lose together
- **Collaborative Solving**: Partners can discuss strategies
- **Synchronized Ready**: Both teammates must be ready to start
- **Substitution**: If a player disconnects, AI takes over temporarily

## Technical Architecture

### Database Schema
```sql
-- Teams table (for persistent teams)
teams (
  id: UUID PRIMARY KEY,
  name: VARCHAR(50),
  tag: VARCHAR(10), -- Team tag/abbreviation
  created_by: UUID REFERENCES users(id),
  created_at: TIMESTAMP,
  is_active: BOOLEAN DEFAULT true
)

-- Team members
team_members (
  team_id: UUID REFERENCES teams(id),
  user_id: UUID REFERENCES users(id),
  role: ENUM('leader', 'member'),
  joined_at: TIMESTAMP,
  PRIMARY KEY (team_id, user_id)
)

-- Team invitations
team_invitations (
  id: UUID PRIMARY KEY,
  team_id: UUID REFERENCES teams(id),
  invited_by: UUID REFERENCES users(id),
  invited_user: UUID REFERENCES users(id),
  status: ENUM('pending', 'accepted', 'declined', 'expired'),
  created_at: TIMESTAMP,
  expires_at: TIMESTAMP
)

-- Temporary party system (for quick play)
party_queue (
  party_id: UUID PRIMARY KEY,
  leader_id: UUID REFERENCES users(id),
  member_id: UUID REFERENCES users(id),
  created_at: TIMESTAMP,
  in_queue: BOOLEAN DEFAULT false,
  game_mode: VARCHAR(20) DEFAULT '2v2_casual'
)

-- 2v2 Match history
team_matches (
  id: UUID PRIMARY KEY,
  team1_player1_id: UUID REFERENCES users(id),
  team1_player2_id: UUID REFERENCES users(id),
  team2_player1_id: UUID REFERENCES users(id),
  team2_player2_id: UUID REFERENCES users(id),
  winning_team: INTEGER, -- 1 or 2
  match_duration: INTEGER,
  rounds_played: INTEGER,
  team1_rounds_won: INTEGER,
  team2_rounds_won: INTEGER,
  game_mode: VARCHAR(20), -- '2v2_casual' or '2v2_ranked'
  created_at: TIMESTAMP
)

-- Team ratings (for ranked 2v2)
team_ratings (
  team_id: UUID REFERENCES teams(id),
  rating: INTEGER DEFAULT 1200,
  games_played: INTEGER DEFAULT 0,
  wins: INTEGER DEFAULT 0,
  losses: INTEGER DEFAULT 0,
  season_id: INTEGER REFERENCES seasons(id),
  PRIMARY KEY (team_id, season_id)
)

-- Individual performance in team games
team_match_performance (
  match_id: UUID REFERENCES team_matches(id),
  player_id: UUID REFERENCES users(id),
  cards_contributed: INTEGER,
  solutions_attempted: INTEGER,
  solutions_correct: INTEGER,
  avg_solution_time: DECIMAL(5,2),
  communication_score: INTEGER, -- Based on helpful comms
  PRIMARY KEY (match_id, player_id)
)
```

### Game State Extensions
```typescript
interface Team2v2GameState extends BaseGameState {
  mode: '2v2';
  teams: {
    team1: {
      players: [Player, Player];
      teamScore: number;
      canClaim: boolean; // Alternates between teams
    };
    team2: {
      players: [Player, Player];
      teamScore: number;
      canClaim: boolean;
    };
  };
  centerCards: Card[]; // 8 cards total
  currentClaimingTeam: 1 | 2 | null;
  teamChat: {
    team1: ChatMessage[];
    team2: ChatMessage[];
  };
}

interface Player2v2 extends Player {
  teamId: 1 | 2;
  partnerId: string;
  cardsContributed: number;
  isTeamLeader: boolean;
}
```

## Implementation Phases

### Phase 1: Infrastructure (team-1.x)
1. **System Design**
   - Define 2v2 game rules and edge cases
   - Design team formation flows
   - Plan communication architecture

2. **Database Setup**
   - Create team-related tables
   - Extend match history for 4 players
   - Design efficient queries for team data

### Phase 2: Backend Implementation (team-2.x)
1. **Team Formation**
   ```typescript
   // Party system for casual play
   class PartyManager {
     createParty(leaderId: string): Party;
     inviteToParty(partyId: string, userId: string): void;
     joinParty(inviteCode: string, userId: string): void;
     queueForMatch(partyId: string): void;
   }

   // Persistent teams for ranked
   class TeamManager {
     createTeam(name: string, leaderId: string): Team;
     inviteToTeam(teamId: string, userId: string): void;
     acceptInvite(inviteId: string): void;
     getTeamStats(teamId: string): TeamStats;
   }
   ```

2. **Game Engine Modifications**
   ```typescript
   class Team2v2GameEngine extends GameEngine {
     // Override methods for 4-player support
     dealCards(): void {
       // Each player contributes 2 cards
       for (const team of [this.team1, this.team2]) {
         for (const player of team.players) {
           const cards = player.deck.draw(2);
           this.centerTable.add(cards);
         }
       }
     }

     handleClaim(teamId: number, playerId: string): void {
       // Verify it's this team's turn to claim
       if (!this.teams[teamId].canClaim) {
         throw new Error("Not your team's turn to claim");
       }
       // Either teammate can build solution
       this.startSolutionPhase(teamId);
     }

     distributeCards(losingTeam: number): void {
       // Each losing player takes 4 cards
       const cards = this.centerTable.removeAll();
       const [player1, player2] = this.teams[losingTeam].players;
       player1.deck.add(cards.slice(0, 4));
       player2.deck.add(cards.slice(4, 8));
     }
   }
   ```

3. **Communication System**
   ```typescript
   // Team communication during rounds
   interface TeamComm {
     sendTeamMessage(teamId: number, message: string): void;
     sendQuickComm(teamId: number, type: QuickCommType): void;
     muteTeamChat(teamId: number): void; // During solution phase
   }

   enum QuickCommType {
     FOUND_SOLUTION = "found_solution",
     NEED_HELP = "need_help",
     ALMOST_THERE = "almost_there",
     NO_SOLUTION = "no_solution",
     NICE_TRY = "nice_try",
     LETS_GO = "lets_go"
   }
   ```

### Phase 3: Frontend Implementation (team-3.x)
1. **Team Lobby UI**
   ```typescript
   // Party creation and management
   <PartyLobby>
     <CreatePartyButton />
     <InviteFriendButton />
     <PartyMembers>
       <PlayerCard player={leader} role="leader" />
       <PlayerCard player={member} role="member" />
     </PartyMembers>
     <QueueButton disabled={!bothReady} />
   </PartyLobby>
   ```

2. **2v2 Game Board Layout**
   ```
   ┌─────────────────────────────────┐
   │         Opponent Team           │
   │  [Player 3]      [Player 4]     │
   │   ■ ■ □ □        ■ ■ ■ □       │
   ├─────────────────────────────────┤
   │                                 │
   │        Center Table (8)         │
   │     [♠][♥][♣][♦]              │
   │     [♠][♥][♣][♦]              │
   │                                 │
   │    [I Know It!] (Team Turn)     │
   ├─────────────────────────────────┤
   │          Your Team              │
   │  [You]           [Partner]      │
   │   ■ ■ ■ □        ■ □ □ □       │
   └─────────────────────────────────┘
   ```

3. **Team-Specific UI Elements**
   - Team colors (Blue vs Red)
   - Partner card highlighting
   - Team chat panel
   - Synchronized timers
   - Team score display

### Phase 4: Team Rankings (team-4.x)
1. **Team ELO System**
   ```typescript
   // Modified ELO for teams
   function calculateTeamELO(
     team1Rating: number,
     team2Rating: number,
     winner: 1 | 2
   ): [number, number] {
     // Average team ratings
     const getTeamAverage = (players: Player[]) => {
       return players.reduce((sum, p) => sum + p.rating, 0) / 2;
     };
     
     // Apply standard ELO with team K-factor
     const K_TEAM = 25; // Higher volatility for teams
     // ... ELO calculation
   }

   // Individual contribution tracking
   interface ContributionScore {
     cardsWonPercentage: number;
     solutionsFound: number;
     communicationScore: number;
     clutchFactor: number; // Performance in critical rounds
   }
   ```

2. **Team Statistics**
   - Win rate as duo
   - Best partner combinations
   - Team synergy score
   - Communication effectiveness
   - Role preferences (aggressive/supportive)

### Phase 5: Advanced Features (team-5.x)
1. **Strategic Elements**
   - Team timeout (once per game, 60 seconds)
   - Solution assistance (highlight possible operations)
   - Team formations (preset strategies)
   - Spectator mode for team matches

2. **Social Features**
   - Team profiles and customization
   - Team achievements
   - Tournament support
   - Team recruitment board

## User Experience

### Matchmaking Flow
```
1. Create/Join Party → 2. Queue for 2v2 → 3. Match Found
         ↓                                        ↓
   4. Team Assignment → 5. Game Start → 6. Play with Partner
         ↓                                        ↓
   7. Post-game Stats → 8. Re-queue or Disband Party
```

### Communication Guidelines
- Team chat active during rounds only
- Muted during opponent's solution attempt
- Quick comms always available
- Voice chat consideration for future

### Ranking Considerations
- Separate 2v2 ranking from solo
- Both casual and ranked modes
- Placement matches for new teams
- Seasonal team leaderboards

## API Endpoints
```typescript
// Team management
POST   /api/teams/create              // Create persistent team
POST   /api/teams/invite              // Invite to team
POST   /api/teams/accept-invite       // Accept team invite
GET    /api/teams/:teamId             // Get team info
DELETE /api/teams/:teamId             // Disband team

// Party system
POST   /api/party/create              // Create party
POST   /api/party/invite              // Invite to party
POST   /api/party/join                // Join party
POST   /api/party/leave               // Leave party
POST   /api/party/queue               // Queue for match

// 2v2 Specific
GET    /api/2v2/leaderboard           // Team leaderboards
GET    /api/2v2/stats/:userId         // User's 2v2 stats
POST   /api/2v2/report-teammate       // Report system
```

## WebSocket Events
```typescript
// Party events
'party:created'
'party:invitation'
'party:member_joined'
'party:member_left'
'party:queue_started'
'party:match_found'

// In-game team events
'team:message'
'team:quick_comm'
'team:partner_action'
'team:claim_turn'
'team:timeout_called'
```

## Performance Considerations
1. **Network Optimization**
   - Batch team updates
   - Efficient state sync for 4 players
   - Regional servers for low latency

2. **UI Performance**
   - Lazy load team components
   - Optimize 8-card animations
   - Efficient team chat rendering

## Success Metrics
1. **Engagement**: 30% of players try 2v2 mode
2. **Retention**: 50% of 2v2 players return weekly
3. **Match Quality**: <300ms latency for team communication
4. **Team Stability**: <10% disconnect rate
5. **Social**: Average 2.5 partners per player

## Implementation Timeline
- Phase 1 (Architecture): 2-3 days
- Phase 2 (Backend): 4-5 days
- Phase 3 (Frontend): 3-4 days
- Phase 4 (Rankings): 2-3 days
- Phase 5 (Polish): 2 days

**Total: 13-17 days**

## Future Enhancements
1. **3v3 Mode** - Larger team battles
2. **Team Tournaments** - Scheduled competitions
3. **Guild System** - Larger communities
4. **Coaching Mode** - Experienced players help beginners
5. **Custom Rules** - Team-created variations
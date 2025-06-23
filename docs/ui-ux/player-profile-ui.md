# Player Profile UI Documentation

## Overview
The Player Profile component provides a comprehensive view of a player's statistics, achievements, and ranked performance in 24 Points. It features a tabbed interface with three main sections: Overview, Ranked, and Badges.

## Component Location
`/client/src/components/Profile/Profile.tsx`

## Features

### 1. Profile Header
- **Avatar**: Large circular avatar with player's initial
- **Username**: Player's display name
- **Member Since**: Join date

### 2. Tabbed Interface
Three main tabs organize different aspects of player data:

#### Overview Tab
- **Game Statistics Grid**:
  - Games Played
  - Games Won
  - Win Rate
  - Average Solve Time
  - Fastest Solve
  - Longest Win Streak
- **Level Indicator**: Shows badge collection progress with animated bar

#### Ranked Tab
- **Rank Display**: Full rank visualization using RankDisplay component
  - Current rating with tier badge
  - Peak rating tracking
  - Win/loss record
  - Win rate percentage
  - Rating progression bar
- **Placement Matches**: Notice if still in placement phase
- **Match History**:
  - Last 10 ranked matches
  - Opponent information with rating
  - Win/loss indicators with color coding
  - Rating changes (+/- display)
  - Match duration
  - Date played
  - Game mode

#### Badges Tab
- **Badge Showcase**: Full badge collection display
- Reuses existing BadgeShowcase component

### 3. Data Loading
The component fetches data from multiple endpoints:
- `get-user-statistics`: General game stats
- `get-user-badges`: Badge collection data
- `ranked:get-rating`: Ranked statistics
- `ranked:get-match-history`: Recent ranked matches

### 4. State Management
```typescript
interface RankedStats {
  currentRating: number;
  peakRating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  placementMatchesRemaining: number;
}

interface MatchHistoryItem {
  matchId: string;
  opponentName: string;
  opponentRating: number;
  result: 'win' | 'loss';
  ratingChange: number;
  newRating: number;
  timestamp: string;
  gameMode: string;
  duration: number;
}
```

## Styling
CSS file: `/client/src/components/Profile/Profile.css`

Key design elements:
- **Tab Navigation**: Bottom border with active indicator
- **Smooth Transitions**: Fade-in animation when switching tabs
- **Color Coding**:
  - Green for wins (#28a745)
  - Red for losses (#dc3545)
  - Yellow for placement notice
- **Responsive Grid**: Stats adapt to screen size
- **Hover Effects**: Match history items translate on hover

## Visual Hierarchy
1. Profile header with large avatar
2. Tab navigation for content organization
3. Content area with appropriate spacing
4. Color-coded elements for quick scanning

## Mobile Responsiveness
- Tabs wrap on small screens
- Match history stacks vertically
- Stats grid adjusts columns
- Smaller font sizes and padding

## Empty States
- "No ranked matches played yet" for new players
- "Play ranked matches to see your statistics" prompt
- Graceful handling of missing data

## Internationalization
All text content uses i18n keys:
- `profile.tabs.overview/ranked/badges`
- `profile.placementMatches`
- `profile.matchHistory`
- `profile.win/loss`
- `profile.noMatchHistory`
- `profile.noRankedStats`

## Integration Points
1. **Authentication**: Checks if viewing own profile
2. **Socket Events**: Real-time data fetching
3. **Rank Components**: Reuses RankDisplay for consistency
4. **Badge System**: Integrates BadgeShowcase component

## Future Enhancements
1. **Rank History Graph**: Visual progression over time
2. **Performance Analytics**: Detailed statistics by game mode
3. **Achievements Section**: Special accomplishments
4. **Social Features**: Friends list, compare profiles
5. **Export Data**: Download match history
6. **Replay Links**: Direct links to match replays from history
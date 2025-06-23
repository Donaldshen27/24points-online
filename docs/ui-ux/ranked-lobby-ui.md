# Ranked Lobby UI Documentation

## Overview
The Ranked Lobby UI provides a matchmaking interface for players to queue for ranked and casual matches in 24 Points. It includes queue management, player statistics display, and match history visualization.

## Components

### RankedLobby Component
Main component located at `/client/src/components/RankedLobby/RankedLobby.tsx`

#### Features:
1. **Dual Queue System**
   - Ranked mode: Requires authentication, tracks ELO rating
   - Casual mode: Open to all players including guests

2. **Queue Status Display**
   - Real-time queue timer
   - Dynamic search range expansion
   - Estimated wait time
   - Visual queue animation

3. **Player Statistics**
   - Current and peak rating display
   - Win/loss record
   - Win rate percentage
   - Placement matches tracking
   - Uses existing RankDisplay component

4. **Match History**
   - Recent matches with opponent info
   - Win/loss indicators
   - Rating changes
   - Relative timestamps

5. **Game Mode Selection**
   - Reuses RoomTypeSelector component
   - Supports Classic, Super, and Extended modes
   - Disabled during active queue

## Socket Events

### Ranked Queue Events:
- `ranked:join-queue` - Join ranked matchmaking
- `ranked:leave-queue` - Leave ranked queue
- `ranked:queue-status` - Get current queue status
- `ranked:match-found` - Match found notification
- `ranked:get-rating` - Fetch player rating
- `ranked:get-match-history` - Fetch recent matches
- `ranked:error` - Queue error handling

### Casual Queue Events:
- `casual:join-queue` - Join casual matchmaking
- `casual:leave-queue` - Leave casual queue
- `casual:queue-status` - Get queue status
- `casual:match-found` - Match found notification
- `casual:error` - Queue error handling

## UI States

### 1. Pre-Queue State
- Mode selection tabs (Ranked/Casual)
- Game mode carousel
- Join queue button
- Player stats (ranked mode)

### 2. Queuing State
- Queue timer display
- Search range indicator
- Estimated wait time
- Leave queue button
- Pulsing animation

### 3. Auth Required State
- Shown when non-authenticated user tries ranked
- Sign in prompt with button
- Informational message

## Styling
CSS file: `/client/src/components/RankedLobby/RankedLobby.css`

Key design elements:
- Gradient backgrounds for ranked elements
- Responsive grid layouts
- Mobile-optimized design
- Smooth transitions and animations
- Color-coded win/loss indicators

## Integration

### App.tsx Changes:
1. Added `RANKED_LOBBY` to AppState enum
2. Import and render RankedLobby component
3. Pass auth modal handlers

### Lobby.tsx Changes:
1. Added `onRankedClick` prop
2. New "Ranked Play" option card
3. Orange gradient styling for ranked button

### Navigation Updates:
- Highlights "Play" nav item when in ranked lobby
- Maintains active state across lobby views

## Internationalization

Added translation keys:
- `ranked.title` - "Matchmaking"
- `ranked.rankedMode` - "Ranked"
- `ranked.casualMode` - "Casual"
- `ranked.joinRankedQueue` - "Find Ranked Match"
- `ranked.queueTime` - "Queue Time"
- `ranked.searchRange` - "Search Range"
- And many more...

Supports both English and Chinese locales.

## Mobile Responsiveness
- Stacked layout on small screens
- Touch-friendly button sizes
- Simplified match history display
- Vertical tab layout on mobile

## Future Enhancements
1. Queue position indicator
2. Recent opponent prevention UI
3. Region selection dropdown
4. Queue statistics graph
5. Animated rank change notifications
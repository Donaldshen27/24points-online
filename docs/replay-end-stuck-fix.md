# Replay End Stuck Fix

## Problem
After the solution replay animation completed (either by timeout or both players skipping), the game was stuck with no new cards being dealt.

## Root Cause
When the replay ended, the server correctly transitioned to the next round, but the clients weren't being notified about:
1. The updated game state (transition from REPLAY to PLAYING)
2. The new round starting with new center cards

## Solution
Added a callback mechanism to notify clients when replay ends:

### 1. GameStateManager Changes
- Added `onReplayEndCallback` property
- Added `setOnReplayEndCallback()` method
- Call the callback in `endReplay()` after starting new round

### 2. RoomManager Changes
- Set up replay end callback when creating GameStateManager
- Added `handleReplayEnd()` method that:
  - Emits updated game state to all players
  - Emits 'round-started' event with new cards

### 3. Flow
1. Replay ends (timeout or both players skip)
2. GameStateManager calls `endReplay()`
3. New round is started
4. Callback triggers `RoomManager.handleReplayEnd()`
5. Clients receive:
   - 'game-state-updated' with PLAYING state
   - 'round-started' with new center cards

## Result
The game now properly transitions from replay to the next round, with all clients receiving the necessary updates to continue playing.

## Testing
1. Complete a round with a correct solution
2. Watch the replay (or skip it)
3. Verify new cards are dealt after replay ends
4. Game continues normally
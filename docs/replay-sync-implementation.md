# Replay Synchronization Implementation

## Overview
Fixed the bug where one player could skip the replay and see the next problem while the other player was still watching, creating an unfair advantage.

## Solution: Server-Controlled Replay State

### 1. Added REPLAY Game State
- New state in GameState enum: `REPLAY`
- Server controls when replay starts and ends
- Prevents clients from independently advancing

### 2. Server-Side Changes

#### GameStateManager
- Added `replaySkipRequests` Set to track skip requests
- Added `replayTimeout` for automatic progression
- Modified `endRound()` to enter REPLAY state for valid solutions
- Added `requestSkipReplay()` method for skip voting
- Added `endReplay()` to transition out of replay state

#### Socket Handler
- Added `skip-replay` event listener
- Tracks which players want to skip
- Only skips when BOTH players request it
- Emits `replay-skipped` when both agree
- Emits `player-wants-skip` to notify others

### 3. Client-Side Changes

#### GameScreen
- Watches for REPLAY state to show/hide replay
- No longer controls replay timing independently
- Waits for server state changes

#### SolutionReplay
- Skip button now sends request to server
- Shows "Waiting for other player to skip..." message
- Listens for `replay-skipped` event to actually skip
- No local skip - always server-controlled

## How It Works

### Normal Flow
1. Player submits correct solution
2. Server enters REPLAY state
3. Both clients show replay for 7 seconds
4. Server automatically ends replay
5. Next round starts for both players

### Skip Flow
1. Player A clicks skip
2. Server records skip request
3. Player A sees "Waiting for other player..."
4. Player B clicks skip
5. Server sees both want to skip
6. Server ends replay immediately
7. Both players advance together

## Benefits

1. **Perfect Synchronization**: Both players always see the same state
2. **Fair Gameplay**: No player can get ahead by skipping
3. **Mutual Agreement**: Skip only works if both agree
4. **Server Authority**: Server controls all timing

## Edge Cases Handled

- Single player skipping: Must wait for other player
- Disconnection during replay: Replay continues normally
- Rapid clicking: Skip request only sent once
- State consistency: Server is single source of truth

## Testing

1. Start a game with 2 players
2. Have one player solve correctly
3. Try skipping from one player - should wait
4. Have other player skip - both should advance
5. Try not skipping - should auto-advance after 7s

The implementation ensures fair gameplay by preventing any player from gaining a time advantage through replay manipulation.
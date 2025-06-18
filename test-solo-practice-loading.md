# Solo Practice Loading Debug Guide

## How to Test

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open browser console (F12) and ensure it's showing all logs

3. Create a solo practice game:
   - Enter your name
   - Check "Solo Practice Mode"
   - Click "Quick Play"

4. Watch for these key log points:

### Expected Log Sequence:

1. **SocketService Logs:**
   - `[SocketService] Creating room: {playerName, roomType: "classic", isSoloPractice: true}`
   - `[SocketService] Event received: room-created`

2. **WaitingRoom Logs:**
   - `[WaitingRoom] Component mounted: {isSoloPractice: true, players: [...]}`
   - `[WaitingRoom] Room updated:` (should show bot joined)
   - `[WaitingRoom] Game starting with countdown:`

3. **GameScreen Logs:**
   - `[GameScreen] Component mounted with: {isSoloPractice: true}`
   - `[GameScreen] Player state:` (should show both players)

4. **useGameState Logs:**
   - `[useGameState] Hook initialized`
   - `[useGameState] Game state updated:` (should show state transitions)

## Common Issues to Look For:

1. **Missing Bot Player:**
   - Check if bot appears in players array
   - Bot should have name "Practice Bot"
   - Bot should auto-ready within 500ms

2. **State Not Transitioning:**
   - Room should go from WAITING → PLAYING
   - Both players must be ready

3. **GameScreen Stuck Loading:**
   - Check `[GameScreen] Still loading - missing data:`
   - Verify hasGameState, hasCurrentPlayer, hasOpponent

4. **Socket Events Not Received:**
   - Check for `[SocketService] Event received: game-state-updated`
   - Verify room-updated events include isSoloPractice flag

## Server-Side Logs:

Also check server console for:
- `[ConnectionHandler] Creating room:`
- `[ConnectionHandler] Adding practice bot to room:`
- `[ConnectionHandler] Bot joined successfully:`
- `[ConnectionHandler] Auto-readying bot:`
- `[RoomManager] getRoomInfo:` (should include isSoloPractice)
- `[GameStateManager] Starting new round:`

## Debug Analysis:

If stuck at loading screen, note:
1. Which player is missing (current or opponent)?
2. What's the last successful log before getting stuck?
3. Are socket events being received?
4. Is the bot being created and added?
5. Is the game state transitioning properly?
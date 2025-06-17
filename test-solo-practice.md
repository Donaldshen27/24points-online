# Solo Practice Mode Test Plan

## Test Steps:

1. Open the app at http://localhost:5173
2. Enter your name
3. Check the "Solo Practice" checkbox
4. Click "Create New Room"
5. Verify that:
   - You are taken directly to the waiting room
   - "Practice Bot" appears as the opponent
   - The bot shows as "Ready" after a short delay
   - The game starts automatically after countdown
   - You can play the game normally
   - The bot never buzzes in
   - You can solve puzzles at your own pace

## Expected Behavior:
- Solo practice rooms should NOT appear in the lobby list
- The bot should auto-ready within 500ms
- Game should start normally with countdown
- Only the human player can claim solutions
- Game continues until one player runs out of cards

## Implementation Summary:
- Added checkbox UI in Lobby component
- Modified socketService to pass isSoloPractice flag
- Server creates bot player immediately after room creation
- Bot auto-readies after 500ms delay
- Solo practice rooms filtered from lobby listings
- No special game logic needed - bot simply never acts
# Guest Username Caching

## Overview
Guest usernames are now automatically cached in the browser's localStorage to improve user experience. Users no longer need to re-enter their username every time they visit the site.

## Implementation Details

### Storage
- **Key**: `guestUsername`
- **Storage**: Browser localStorage
- **Persistence**: Until manually cleared or user logs in with an account

### Features
1. **Automatic Loading**: When a guest user visits the site, their previously used username is automatically loaded
2. **Real-time Saving**: Username is saved whenever:
   - User creates a room
   - User joins a room
   - User types in the username field (auto-save on change)
3. **Authentication Handling**: 
   - Guest username is ignored when user is authenticated
   - Guest username is cleared when user logs in with an account
   - Authenticated usernames take priority over cached guest usernames

### User Experience
- Guest users see their previous username pre-filled in the input field
- No need to type username repeatedly across sessions
- Username persists even after browser restart
- Clean separation between guest and authenticated users

### Technical Implementation
- New service: `client/src/services/guestService.ts`
- Modified component: `client/src/components/Lobby/Lobby.tsx`
- Uses the same localStorage pattern as the existing auth service
- Error handling for localStorage operations
- No "guest" prefix added to usernames (as requested)
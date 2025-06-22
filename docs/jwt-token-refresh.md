# JWT Token Refresh Implementation

## Overview
Implemented automatic JWT token refresh to handle token expiration gracefully without forcing users to re-login.

## Changes Made

### Server-Side
1. **Added `/api/auth/refresh` endpoint** (`server/src/routes/auth.ts`)
   - Accepts refresh token from httpOnly cookie
   - Validates refresh token and generates new access/refresh tokens
   - Updates session with new tokens

2. **Added `refreshTokens` method** (`server/src/auth/authService.ts`)
   - Verifies refresh token validity
   - Checks session existence and expiration
   - Generates new token pair
   - Creates new session replacing the old one

3. **Enhanced Socket.io auth middleware** (`server/src/index.ts`)
   - Returns specific "jwt expired" error for expired tokens
   - Allows client to handle token refresh

4. **Added cookie-parser middleware**
   - Installed `cookie-parser` package
   - Configured Express to parse cookies for refresh token handling

5. **Increased JWT expiration time**
   - Changed from 15 minutes to 1 hour to reduce refresh frequency

### Client-Side
1. **Enhanced authService** (`client/src/services/authService.ts`)
   - Added `refreshAccessToken()` method with de-duplication
   - Created `fetchWithAuth()` wrapper for automatic retry on 401
   - Updated `restoreSession()` to use token refresh
   - Added `getCurrentUserWithRefresh()` method

2. **Updated Socket.io connection** (`client/src/services/socketService.ts`)
   - Added connect_error handler for JWT expiration
   - Automatically refreshes token and reconnects on expiration

## Token Flow
1. User logs in → receives access token (1h) and refresh token (7d)
2. Access token stored in localStorage, refresh token in httpOnly cookie
3. When access token expires:
   - API calls automatically refresh and retry
   - Socket.io connection refreshes and reconnects
4. If refresh fails, user is logged out

## Security Considerations
- Refresh tokens stored in httpOnly cookies (not accessible via JS)
- Short-lived access tokens (1 hour)
- Session validation on refresh
- Automatic session cleanup on logout

## Usage
The system works transparently - no code changes needed in components. All authentication-related API calls and Socket.io connections automatically handle token refresh.
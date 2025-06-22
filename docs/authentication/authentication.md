# Authentication System Documentation

## Overview
The 24 Points game now includes a complete authentication system with login/signup functionality. The system supports both authenticated and anonymous play.

## Architecture

### Frontend
- **AuthContext**: React Context that manages authentication state globally
- **useAuth Hook**: Provides access to auth state and methods (login, register, logout)
- **AuthModal**: Modal UI for login/signup forms
- **SignInForm/SignUpForm**: Pre-built form components with validation
- **ProtectedRoute**: Component for protecting routes that require authentication

### Backend
- **JWT Authentication**: Access tokens (15min) and refresh tokens (7 days)
- **Auth Endpoints**:
  - POST `/api/auth/register` - User registration
  - POST `/api/auth/login` - User login
  - POST `/api/auth/logout` - User logout
  - GET `/api/auth/me` - Get current user
- **Socket.io Integration**: Authenticated socket connections with JWT verification

## Features

### Current Implementation
1. **User Registration**: Username, email, password with validation
2. **User Login**: Email/password authentication
3. **Session Management**: Automatic session restoration on app load
4. **Socket Authentication**: Authenticated users automatically use their username in games
5. **Anonymous Play**: Users can still play without creating an account

### Database Schema (Proposed for Supabase)
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User statistics
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  rating INTEGER DEFAULT 1000
);
```

## Usage

### For Users
1. Click "Sign In" in the navigation bar
2. Create an account or log in with existing credentials
3. Once logged in, your username is automatically used in games
4. Your game history and statistics will be tracked (when database is connected)

### For Developers
```typescript
// Access auth state in components
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, isLoading, login, logout } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;
  
  return <div>Welcome, {user.username}!</div>;
}
```

## Cache Management

The authentication system properly integrates with the caching system:

### Cache Clearing on Login/Register
- Puzzle records cache is cleared
- Leaderboard cache is cleared  
- Guest username is removed from localStorage
- Ensures clean state for the new user

### Cache Clearing on Logout
- All memory caches are cleared
- Guest username is cleared
- Socket disconnects and reconnects to clear auth state
- Prevents data leakage between users

### Guest Username Handling
- Guest usernames are only saved for non-authenticated users
- Automatically cleared when a user logs in
- Authenticated users always use their account username

## Security Considerations
- Passwords are hashed with bcrypt
- JWT tokens are stored securely
- Refresh tokens use httpOnly cookies
- CORS is properly configured
- Anonymous play is still allowed for accessibility
- Proper cache invalidation prevents data leakage between users

## Next Steps
1. Connect to Supabase for persistent user storage
2. Implement password reset functionality
3. Add email verification
4. Enable social login (Google, GitHub)
5. Create user profiles and statistics pages
6. Add friend system and private rooms
7. Implement achievement system

## Testing the Authentication
1. Start the development servers:
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

2. Navigate to http://localhost:5173
3. Click "Sign In" in the navigation
4. Create a test account
5. Verify that your username appears in games
6. Test logout and login functionality

## Notes
- The system currently uses in-memory storage (development only)
- Production deployment requires database configuration
- All game features work with or without authentication
- Authenticated users get additional features like stats tracking
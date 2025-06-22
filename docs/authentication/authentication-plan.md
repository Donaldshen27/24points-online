# Authentication System Implementation Plan

## Overview
Implement a comprehensive authentication system for the 24 Points game supporting:
- Email/password registration and login
- Google OAuth signin
- WeChat OAuth signin
- Account linking (allow users to link multiple auth methods)
- Session management with JWT tokens
- User profiles and statistics tracking

## Architecture Design

### Backend Components
1. **Authentication Service**
   - JWT token generation and validation
   - Session management
   - Password hashing (bcrypt)
   - OAuth provider integration

2. **Database Schema**
   ```sql
   -- Users table
   users (
     id: UUID PRIMARY KEY,
     username: VARCHAR(50) UNIQUE,
     email: VARCHAR(255) UNIQUE,
     email_verified: BOOLEAN DEFAULT false,
     password_hash: VARCHAR(255),
     created_at: TIMESTAMP,
     updated_at: TIMESTAMP,
     last_login: TIMESTAMP,
     profile_picture: VARCHAR(500),
     display_name: VARCHAR(100)
   )

   -- OAuth accounts table
   oauth_accounts (
     id: UUID PRIMARY KEY,
     user_id: UUID REFERENCES users(id),
     provider: ENUM('google', 'wechat'),
     provider_user_id: VARCHAR(255),
     access_token: TEXT,
     refresh_token: TEXT,
     expires_at: TIMESTAMP,
     profile_data: JSONB,
     created_at: TIMESTAMP,
     UNIQUE(provider, provider_user_id)
   )

   -- Sessions table (for persistent sessions)
   sessions (
     id: UUID PRIMARY KEY,
     user_id: UUID REFERENCES users(id),
     token: VARCHAR(500) UNIQUE,
     expires_at: TIMESTAMP,
     ip_address: INET,
     user_agent: TEXT,
     created_at: TIMESTAMP
   )

   -- Password reset tokens
   password_reset_tokens (
     id: UUID PRIMARY KEY,
     user_id: UUID REFERENCES users(id),
     token: VARCHAR(255) UNIQUE,
     expires_at: TIMESTAMP,
     used: BOOLEAN DEFAULT false,
     created_at: TIMESTAMP
   )

   -- Game statistics (linked to users)
   user_stats (
     user_id: UUID PRIMARY KEY REFERENCES users(id),
     games_played: INTEGER DEFAULT 0,
     games_won: INTEGER DEFAULT 0,
     total_rounds_played: INTEGER DEFAULT 0,
     total_rounds_won: INTEGER DEFAULT 0,
     fastest_solution_time: INTEGER,
     created_at: TIMESTAMP,
     updated_at: TIMESTAMP
   )
   ```

3. **API Endpoints**
   - `POST /api/auth/signup` - Email/password registration
   - `POST /api/auth/signin` - Email/password login
   - `POST /api/auth/signout` - Logout
   - `POST /api/auth/refresh` - Refresh JWT token
   - `POST /api/auth/forgot-password` - Request password reset
   - `POST /api/auth/reset-password` - Reset password with token
   - `GET /api/auth/verify-email/:token` - Verify email address
   - `GET /api/auth/google` - Initiate Google OAuth
   - `GET /api/auth/google/callback` - Google OAuth callback
   - `GET /api/auth/wechat` - Initiate WeChat OAuth
   - `GET /api/auth/wechat/callback` - WeChat OAuth callback
   - `GET /api/auth/me` - Get current user profile
   - `PUT /api/auth/profile` - Update user profile
   - `POST /api/auth/link/:provider` - Link OAuth account
   - `DELETE /api/auth/unlink/:provider` - Unlink OAuth account

### Frontend Components
1. **Authentication Context**
   - User state management
   - Token storage (localStorage/cookies)
   - Auto-refresh logic
   - Protected route wrapper

2. **UI Components**
   - `LoginModal` - Signin/signup forms with tabs
   - `OAuthButtons` - Google/WeChat signin buttons
   - `PasswordReset` - Forgot password flow
   - `ProfileSettings` - User profile management
   - `AccountLinking` - Link/unlink OAuth accounts

3. **Authentication Flow**
   ```
   User → Login Page → Choose Method
   ├── Email/Password
   │   ├── Signup → Email Verification → Dashboard
   │   └── Signin → Dashboard
   ├── Google OAuth
   │   └── Popup/Redirect → Callback → Dashboard
   └── WeChat OAuth
       └── QR Code → Scan → Callback → Dashboard
   ```

## Implementation Details

### Phase 1: Core Infrastructure (auth-1.x)
- Set up database with ORM (Prisma/TypeORM)
- Install authentication libraries (Passport.js, jsonwebtoken, bcrypt)
- Configure OAuth applications (Google Cloud Console, WeChat Open Platform)
- Set up environment variables and configuration

### Phase 2: Backend Implementation (auth-2.x & auth-3.x)
- Create user and authentication models
- Implement JWT utilities and middleware
- Build email/password authentication endpoints
- Integrate Google OAuth with Passport.js
- Integrate WeChat OAuth (may need special handling for China)
- Add account linking functionality

### Phase 3: Frontend Implementation (auth-4.x)
- Create AuthContext and useAuth hook
- Build login/signup UI components
- Implement OAuth popup/redirect flows
- Add loading states and error handling
- Create profile management pages

### Phase 4: Integration (auth-5.x)
- Update Socket.io to use authenticated connections
- Modify room management to use user IDs
- Link game statistics to user accounts
- Update UI to show usernames instead of generic "Player 1/2"

### Phase 5: Security & Testing (auth-6.x)
- Add rate limiting for auth endpoints
- Implement CSRF protection
- Add input validation and sanitization
- Write comprehensive tests
- Add security headers

### Phase 6: Documentation & Deployment (auth-7.x)
- Document API endpoints
- Create setup guides for OAuth providers
- Update deployment configurations
- Add monitoring and logging

## Technical Considerations

### Security
- Use HTTPS for all authentication endpoints
- Store passwords with bcrypt (min 10 rounds)
- JWT tokens with short expiry (15 min) and refresh tokens
- Secure cookie storage for tokens
- Rate limiting on authentication endpoints
- CSRF protection for state-changing operations

### OAuth Integration
- **Google**: Use official Google Sign-In SDK
- **WeChat**: 
  - Different APIs for China vs International
  - May need ICP license for China
  - QR code login is primary method

### Session Management
- JWT for stateless authentication
- Refresh tokens stored in httpOnly cookies
- Automatic token refresh before expiry
- Logout invalidates refresh token

### Account Linking
- Allow users to link multiple auth methods
- Merge accounts if email matches
- Prevent duplicate account creation
- Handle provider-specific data (avatar, display name)

### Mobile Considerations
- OAuth redirects may not work in WebView
- Consider deep linking for mobile apps
- Touch-friendly UI for authentication forms

## Dependencies
- **Backend**: 
  - passport, passport-local, passport-google-oauth20
  - jsonwebtoken, bcryptjs
  - express-session (optional)
  - Database ORM (Prisma recommended)
  
- **Frontend**:
  - react-oauth/google
  - Custom WeChat SDK integration
  - axios for API calls
  - react-hook-form for forms

## Environment Variables
```env
# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# WeChat OAuth
WECHAT_APP_ID=your-wechat-app-id
WECHAT_APP_SECRET=your-wechat-app-secret
WECHAT_CALLBACK_URL=http://localhost:3001/api/auth/wechat/callback

# Email (for verification)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Success Criteria
1. Users can register and login with email/password
2. Users can signin with Google account
3. Users can signin with WeChat account
4. Existing game features work with authenticated users
5. User statistics are tracked and displayed
6. Account linking works seamlessly
7. Security best practices are followed
8. Mobile-friendly authentication flow

## Timeline Estimate
- Phase 1: 1-2 days (setup and design)
- Phase 2: 3-4 days (backend implementation)
- Phase 3: 2-3 days (frontend implementation)
- Phase 4: 1-2 days (integration)
- Phase 5: 1-2 days (security and testing)
- Phase 6: 1 day (documentation)

**Total: 10-16 days**
# Login API Endpoint Documentation

## POST /api/auth/login

Authenticates a user with email and password, returning JWT tokens for session management.

### Request

**URL:** `POST /api/auth/login`

**Headers:**
- `Content-Type: application/json`

**Body:**
```json
{
  "email": "string",     // Required: User's email address
  "password": "string"   // Required: User's password
}
```

### Response

#### Success (200 OK)
```json
{
  "accessToken": "string",  // JWT access token (expires in 15 minutes)
  "user": {
    "id": "string",         // User's unique ID
    "email": "string",      // User's email
    "username": "string",   // User's username
    "role": "string"        // User's role (admin, worker, viewer)
  }
}
```

**Cookies:**
- `refreshToken`: HTTP-only cookie containing refresh token (expires in 7 days)

#### Error Responses

**400 Bad Request**
```json
{
  "error": "Email and password are required"
}
```

**401 Unauthorized**
```json
{
  "error": "Invalid credentials"  // Wrong email/password or inactive account
}
```

### Authentication Flow

1. Client sends email and password to `/api/auth/login`
2. Server validates credentials against stored user data
3. If valid, server generates:
   - Access token (short-lived, 15 minutes)
   - Refresh token (long-lived, 7 days)
4. Server returns access token in response body
5. Server sets refresh token as HTTP-only cookie
6. Client stores access token and includes it in subsequent requests

### Security Features

- Passwords are hashed using bcrypt with 10 salt rounds
- JWT tokens use environment-configured secret
- Failed login attempts are logged in audit trail
- Refresh tokens are stored as HTTP-only cookies
- IP address and user agent are tracked for sessions

### Usage Example

```javascript
// Login request
const response = await fetch('http://localhost:3024/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',  // Important for cookies
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword'
  })
});

const data = await response.json();

if (response.ok) {
  // Store access token for future requests
  localStorage.setItem('accessToken', data.accessToken);
  console.log('Logged in as:', data.user.username);
} else {
  console.error('Login failed:', data.error);
}

// Using the access token in subsequent requests
const protectedResponse = await fetch('http://localhost:3024/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});
```

### Test User

For development/testing, a default user is available:
- Email: `test@example.com`
- Password: `password123`
- Role: `viewer`

### Related Endpoints

- `POST /api/auth/logout` - Logout and invalidate session
- `GET /api/auth/me` - Get current user information
- `POST /api/auth/refresh` - Refresh access token (not yet implemented)

### Implementation Details

- **Location:** `/server/src/routes/auth.ts`
- **Service:** `/server/src/auth/authService.ts`
- **JWT Utilities:** `/server/src/auth/jwt.ts`
- **User Repository:** `/server/src/models/userRepository.ts`
- **Tests:** `/server/src/__tests__/auth.test.ts`

### Notes

- Currently uses in-memory storage for users (will be replaced with database)
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- All authentication endpoints log actions to audit trail
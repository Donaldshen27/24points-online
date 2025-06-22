# User Registration API

## Endpoint
`POST /api/auth/register`

## Description
Creates a new user account and automatically logs them in, returning JWT tokens for authentication.

## Request Body
```json
{
  "email": "user@example.com",
  "username": "username123",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123"
}
```

### Field Requirements

| Field | Type | Requirements |
|-------|------|--------------|
| email | string | Required. Must be a valid email format |
| username | string | Required. 3-20 characters, alphanumeric with underscores only |
| password | string | Required. Minimum 8 characters, must contain uppercase, lowercase, and number |
| confirmPassword | string | Required. Must match password field |

## Password Requirements
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

## Response

### Success (201 Created)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "username": "username123",
    "role": "viewer"
  }
}
```

The response also sets a `refreshToken` as an httpOnly cookie with the following properties:
- httpOnly: true
- secure: true (in production)
- sameSite: 'strict'
- maxAge: 7 days

### Error Responses

#### 400 Bad Request
Various validation errors:

```json
{
  "error": "All fields are required"
}
```

```json
{
  "error": "Invalid email format"
}
```

```json
{
  "error": "Username must be 3-20 characters and contain only letters, numbers, and underscores"
}
```

```json
{
  "error": "Password must be at least 8 characters long. Password must contain at least one uppercase letter"
}
```

```json
{
  "error": "Passwords do not match"
}
```

```json
{
  "error": "Email already registered"
}
```

```json
{
  "error": "Username already taken"
}
```

## Example Usage

### cURL
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "username": "newuser123",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123"
  }'
```

### JavaScript (Fetch API)
```javascript
const response = await fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'newuser@example.com',
    username: 'newuser123',
    password: 'SecurePass123',
    confirmPassword: 'SecurePass123'
  }),
  credentials: 'include' // Important for cookies
});

if (response.ok) {
  const data = await response.json();
  console.log('Registration successful:', data);
  // Store the access token for future API calls
  localStorage.setItem('accessToken', data.accessToken);
} else {
  const error = await response.json();
  console.error('Registration failed:', error.error);
}
```

## Notes
- New users are created with the default role of 'viewer'
- Upon successful registration, the user is automatically logged in
- The account is set as active by default
- All registration attempts (successful and failed) are logged in the audit system
- Email addresses must be unique across the system
- Usernames must be unique across the system
import { Router, Request, Response } from 'express';
import { authService } from '../auth/authService';
import { LoginRequest, RegisterRequest } from '../types/authTypes';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Register endpoint
router.post('/register', async (req: Request, res: Response) => {
  try {
    const registrationData: RegisterRequest = req.body;
    
    // Get client info
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    // Perform registration
    const result = await authService.register(registrationData, ipAddress, userAgent);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return access token and user info
    res.status(201).json({
      accessToken: result.accessToken,
      user: result.user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Registration failed' });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const credentials: LoginRequest = req.body;
    
    // Validate input
    if (!credentials.email || !credentials.password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get client info
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    // Perform login
    const result = await authService.login(credentials, ipAddress, userAgent);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return access token and user info
    res.json({
      accessToken: result.accessToken,
      user: result.user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error instanceof Error ? error.message : 'Login failed' });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    await authService.logout(req.user.userId, ipAddress, userAgent);

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user endpoint
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    res.json({
      user: {
        id: req.user.userId,
        email: req.user.email,
        username: req.user.username,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Check username availability endpoint
router.get('/check-username/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    
    // Validate username format - allow 2-20 characters
    if (!username || !/^[a-zA-Z0-9_-]{2,20}$/.test(username)) {
      return res.json({ 
        available: false, 
        reason: 'invalid_format' 
      });
    }
    
    const existingUser = await authService.checkUsernameAvailability(username);
    
    res.json({ 
      available: !existingUser,
      reason: existingUser ? 'already_taken' : null
    });
  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({ error: 'Failed to check username' });
  }
});

export default router;
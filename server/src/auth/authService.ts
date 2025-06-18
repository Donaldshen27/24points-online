import { LoginRequest, LoginResponse } from '../types/authTypes';
import { userRepository, sessionRepository, auditRepository } from '../models/userRepository';
import { generateAccessToken, generateRefreshToken } from './jwt';
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  async login(
    credentials: LoginRequest,
    ipAddress: string,
    userAgent: string
  ): Promise<LoginResponse> {
    const { email, password } = credentials;

    // Find user by email
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      await auditRepository.log({
        userId: 'anonymous',
        action: 'failed_login',
        ipAddress,
        userAgent,
        metadata: { email, reason: 'user_not_found' }
      });
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      await auditRepository.log({
        userId: user.id,
        action: 'failed_login',
        ipAddress,
        userAgent,
        metadata: { reason: 'account_inactive' }
      });
      throw new Error('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await userRepository.comparePassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      await auditRepository.log({
        userId: user.id,
        action: 'failed_login',
        ipAddress,
        userAgent,
        metadata: { reason: 'invalid_password' }
      });
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const sessionId = uuidv4();
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      sessionId
    });

    // Create session
    await sessionRepository.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ipAddress,
      userAgent
    });

    // Update last login
    await userRepository.updateLastLogin(user.id);

    // Log successful login
    await auditRepository.log({
      userId: user.id,
      action: 'login',
      ipAddress,
      userAgent
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    };
  }

  async logout(userId: string, ipAddress: string, userAgent: string): Promise<void> {
    // Delete all sessions for the user
    await sessionRepository.deleteByUserId(userId);

    // Log logout
    await auditRepository.log({
      userId,
      action: 'logout',
      ipAddress,
      userAgent
    });
  }
}

export const authService = new AuthService();
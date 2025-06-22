import { LoginRequest, LoginResponse, RegisterRequest } from '../types/authTypes';
import { userRepository, sessionRepository, auditRepository } from '../models/userRepository';
import { generateAccessToken, generateRefreshToken } from './jwt';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { authConfig } from '../config/auth';
import { SupabaseUserRepository } from '../models/supabaseUserRepository';

export class AuthService {
  async checkUsernameAvailability(username: string): Promise<boolean> {
    const existingUser = await userRepository.findByUsername(username);
    return !!existingUser;
  }
  // Validation helpers
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  private validateUsername(username: string): boolean {
    // Username must be 1-20 characters, alphanumeric with underscores and hyphens
    const usernameRegex = /^[a-zA-Z0-9_-]{1,20}$/;
    return usernameRegex.test(username);
  }

  async register(
    registrationData: RegisterRequest,
    ipAddress: string,
    userAgent: string
  ): Promise<LoginResponse> {
    const { email, username, password, confirmPassword } = registrationData;

    // Validate all fields are provided
    if (!email || !username || !password || !confirmPassword) {
      throw new Error('All fields are required');
    }

    // Validate email format
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Validate username format
    if (!this.validateUsername(username)) {
      throw new Error('Username must be 1-20 characters and contain only letters, numbers, hyphens, and underscores');
    }

    // Validate password strength
    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join('. '));
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Check if email already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      await auditRepository.log({
        userId: 'anonymous',
        action: 'register',
        ipAddress,
        userAgent,
        metadata: { email, reason: 'email_already_exists' }
      });
      throw new Error('Email already registered');
    }

    // Check if username already exists
    const existingUsername = await userRepository.findByUsername(username);
    if (existingUsername) {
      await auditRepository.log({
        userId: 'anonymous',
        action: 'register',
        ipAddress,
        userAgent,
        metadata: { username, reason: 'username_already_exists' }
      });
      throw new Error('Username already taken');
    }

    // Create user
    // When using Supabase, password hashing is handled in the repository
    const user = await userRepository.create({
      email,
      username,
      passwordHash: password, // Pass plain password, repository will hash it
      role: 'viewer', // Default role for new users
      lastLogin: null,
      isActive: true
    });

    // Log successful registration
    await auditRepository.log({
      userId: user.id,
      action: 'register',
      ipAddress,
      userAgent,
      metadata: { email, username }
    });

    // Auto-login: Generate tokens
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
    // When using Supabase, we need to check password differently
    let isPasswordValid = false;
    
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      // Use Supabase password verification
      const supabaseRepo = SupabaseUserRepository.getInstance();
      isPasswordValid = await supabaseRepo.verifyPassword(email, password);
    } else {
      // Use local bcrypt comparison
      isPasswordValid = await userRepository.comparePassword(password, user.passwordHash);
    }
    
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
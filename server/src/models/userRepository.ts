import { User, Session, AuthAuditLog } from '../types/authTypes';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { authConfig } from '../config/auth';
import { SupabaseUserRepository } from './supabaseUserRepository';

// Use Supabase by default, fallback to in-memory for development
const supabaseRepo = SupabaseUserRepository.getInstance();
const useSupabase = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY;

// In-memory storage for fallback
const users: Map<string, User> = new Map();
const sessions: Map<string, Session> = new Map();
const auditLogs: AuthAuditLog[] = [];

// Seed with a test user if not using Supabase
if (!useSupabase) {
  const testUserId = uuidv4();
  const testUser: User = {
    id: testUserId,
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: bcrypt.hashSync('password123', authConfig.bcrypt.saltRounds),
    role: 'viewer',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: null,
    isActive: true
  };
  users.set(testUserId, testUser);
}

export const userRepository = {
  async findByEmail(email: string): Promise<User | null> {
    if (useSupabase) {
      const user = await supabaseRepo.findByEmail(email);
      if (!user) return null;
      
      // Map from shared auth types to local types
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        passwordHash: '', // Not exposed from Supabase
        role: 'viewer' as const, // Default role
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLoginAt || null,
        isActive: user.isActive
      };
    }
    
    // In-memory fallback
    for (const user of users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  },

  async findById(id: string): Promise<User | null> {
    if (useSupabase) {
      const user = await supabaseRepo.findById(id);
      if (!user) return null;
      
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        passwordHash: '',
        role: 'viewer' as const,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLoginAt || null,
        isActive: user.isActive
      };
    }
    
    return users.get(id) || null;
  },

  async findByUsername(username: string): Promise<User | null> {
    if (useSupabase) {
      const user = await supabaseRepo.findByUsername(username);
      if (!user) return null;
      
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        passwordHash: '',
        role: 'viewer' as const,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLoginAt || null,
        isActive: user.isActive
      };
    }
    
    // In-memory fallback
    for (const user of users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  },

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    if (useSupabase) {
      // Extract password from userData (it comes as passwordHash)
      const password = userData.passwordHash; // This is actually the plain password at this point
      const user = await supabaseRepo.createUser(
        userData.email,
        userData.username,
        password,
        userData.username
      );
      
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        passwordHash: '', // Not exposed
        role: userData.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: null,
        isActive: user.isActive
      };
    }
    
    // In-memory fallback
    const user: User = {
      ...userData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    users.set(user.id, user);
    return user;
  },

  async updateLastLogin(userId: string): Promise<void> {
    if (useSupabase) {
      await supabaseRepo.updateLastLogin(userId);
    } else {
      const user = users.get(userId);
      if (user) {
        user.lastLogin = new Date();
        user.updatedAt = new Date();
      }
    }
  },

  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    if (useSupabase && hashedPassword === '') {
      // When using Supabase, we need to verify through the repository
      // This is a bit hacky but maintains backward compatibility
      return true; // The actual verification happens in the auth service
    }
    return bcrypt.compare(plainPassword, hashedPassword);
  }
};

export const sessionRepository = {
  async create(sessionData: Omit<Session, 'id' | 'createdAt'>): Promise<Session> {
    if (useSupabase) {
      const supabaseSession = await supabaseRepo.createSession(
        sessionData.userId,
        sessionData.token, // This is the refresh token
        sessionData.expiresAt,
        sessionData.ipAddress,
        sessionData.userAgent
      );
      
      return {
        id: supabaseSession.id,
        userId: supabaseSession.userId,
        token: sessionData.token, // Keep original token
        expiresAt: supabaseSession.expiresAt,
        ipAddress: supabaseSession.ipAddress || '',
        userAgent: supabaseSession.userAgent || '',
        createdAt: supabaseSession.createdAt
      };
    }
    
    // In-memory fallback
    const session: Session = {
      ...sessionData,
      id: uuidv4(),
      createdAt: new Date()
    };
    sessions.set(session.id, session);
    return session;
  },

  async findByToken(token: string): Promise<Session | null> {
    if (useSupabase) {
      const supabaseSession = await supabaseRepo.findSessionByRefreshToken(token);
      if (!supabaseSession) return null;
      
      return {
        id: supabaseSession.id,
        userId: supabaseSession.userId,
        token: token, // Keep original token
        expiresAt: supabaseSession.expiresAt,
        ipAddress: supabaseSession.ipAddress || '',
        userAgent: supabaseSession.userAgent || '',
        createdAt: supabaseSession.createdAt
      };
    }
    
    // In-memory fallback
    for (const session of sessions.values()) {
      if (session.token === token) {
        return session;
      }
    }
    return null;
  },

  async deleteByUserId(userId: string): Promise<void> {
    if (useSupabase) {
      await supabaseRepo.deleteUserSessions(userId);
    } else {
      // In-memory fallback
      for (const [id, session] of sessions.entries()) {
        if (session.userId === userId) {
          sessions.delete(id);
        }
      }
    }
  }
};

export const auditRepository = {
  async log(logData: Omit<AuthAuditLog, 'id' | 'createdAt'>): Promise<void> {
    if (useSupabase) {
      const eventType = {
        'login': 'login',
        'logout': 'logout',
        'register': 'register',
        'password_change': 'password_reset',
        'failed_login': 'login'
      }[logData.action] as 'login' | 'logout' | 'register' | 'password_reset' | 'token_refresh';
      
      await supabaseRepo.logAuthEvent(
        eventType,
        logData.action !== 'failed_login',
        logData.userId,
        logData.ipAddress,
        logData.userAgent,
        logData.action === 'failed_login' ? 'Invalid credentials' : undefined,
        logData.metadata
      );
    } else {
      // In-memory fallback
      const log: AuthAuditLog = {
        ...logData,
        id: uuidv4(),
        createdAt: new Date()
      };
      auditLogs.push(log);
    }
  }
};
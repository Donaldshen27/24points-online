import { User, Session, AuthAuditLog } from '../types/authTypes';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { authConfig } from '../config/auth';

// In-memory storage for development (replace with database in production)
const users: Map<string, User> = new Map();
const sessions: Map<string, Session> = new Map();
const auditLogs: AuthAuditLog[] = [];

// Seed with a test user
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

export const userRepository = {
  async findByEmail(email: string): Promise<User | null> {
    for (const user of users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  },

  async findById(id: string): Promise<User | null> {
    return users.get(id) || null;
  },

  async findByUsername(username: string): Promise<User | null> {
    for (const user of users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  },

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
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
    const user = users.get(userId);
    if (user) {
      user.lastLogin = new Date();
      user.updatedAt = new Date();
    }
  },

  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
};

export const sessionRepository = {
  async create(sessionData: Omit<Session, 'id' | 'createdAt'>): Promise<Session> {
    const session: Session = {
      ...sessionData,
      id: uuidv4(),
      createdAt: new Date()
    };
    sessions.set(session.id, session);
    return session;
  },

  async findByToken(token: string): Promise<Session | null> {
    for (const session of sessions.values()) {
      if (session.token === token) {
        return session;
      }
    }
    return null;
  },

  async deleteByUserId(userId: string): Promise<void> {
    for (const [id, session] of sessions.entries()) {
      if (session.userId === userId) {
        sessions.delete(id);
      }
    }
  }
};

export const auditRepository = {
  async log(logData: Omit<AuthAuditLog, 'id' | 'createdAt'>): Promise<void> {
    const log: AuthAuditLog = {
      ...logData,
      id: uuidv4(),
      createdAt: new Date()
    };
    auditLogs.push(log);
  }
};
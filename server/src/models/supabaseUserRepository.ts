import { supabase } from '../db/supabase';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { User, Session, AuthAuditLog } from '../../shared/types/auth';

export class SupabaseUserRepository {
  private static instance: SupabaseUserRepository;
  private useSupabase: boolean;
  
  // Fallback in-memory storage if Supabase is not configured
  private memoryUsers = new Map<string, User>();
  private memorySessions = new Map<string, Session>();
  private memoryAuditLogs: AuthAuditLog[] = [];

  private constructor() {
    this.useSupabase = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY;
    
    if (!this.useSupabase) {
      console.warn('Supabase not configured. Using in-memory storage for authentication.');
      this.seedTestUser();
    }
  }

  static getInstance(): SupabaseUserRepository {
    if (!SupabaseUserRepository.instance) {
      SupabaseUserRepository.instance = new SupabaseUserRepository();
    }
    return SupabaseUserRepository.instance;
  }

  private seedTestUser(): void {
    if (!this.useSupabase) {
      const testUser: User = {
        id: 'test-user-id',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        isVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.memoryUsers.set(testUser.id, testUser);
    }
  }

  async createUser(email: string, username: string, password: string, displayName?: string): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10);
    
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('users')
        .insert({
          email,
          username,
          password_hash: passwordHash,
          display_name: displayName || username,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          if (error.message.includes('email')) {
            throw new Error('Email already exists');
          } else if (error.message.includes('username')) {
            throw new Error('Username already exists');
          }
        }
        throw error;
      }

      return {
        id: data.id,
        email: data.email,
        username: data.username,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        isVerified: data.is_verified,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
      };
    } else {
      // In-memory implementation
      const existingByEmail = Array.from(this.memoryUsers.values()).find(u => u.email === email);
      if (existingByEmail) throw new Error('Email already exists');
      
      const existingByUsername = Array.from(this.memoryUsers.values()).find(u => u.username === username);
      if (existingByUsername) throw new Error('Username already exists');

      const user: User = {
        id: crypto.randomUUID(),
        email,
        username,
        displayName: displayName || username,
        isVerified: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.memoryUsers.set(user.id, user);
      return user;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        email: data.email,
        username: data.username,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        isVerified: data.is_verified,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
      };
    } else {
      return Array.from(this.memoryUsers.values()).find(u => u.email === email) || null;
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        email: data.email,
        username: data.username,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        isVerified: data.is_verified,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
      };
    } else {
      return Array.from(this.memoryUsers.values()).find(u => u.username === username) || null;
    }
  }

  async findById(id: string): Promise<User | null> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        email: data.email,
        username: data.username,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        isVerified: data.is_verified,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
      };
    } else {
      return this.memoryUsers.get(id) || null;
    }
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('users')
        .select('password_hash')
        .eq('email', email)
        .single();

      if (error || !data) return false;
      
      return bcrypt.compare(password, data.password_hash);
    } else {
      // In-memory: for testing only, accept any password for test user
      const user = await this.findByEmail(email);
      return user !== null && email === 'test@example.com';
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    if (this.useSupabase) {
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);
    } else {
      const user = this.memoryUsers.get(userId);
      if (user) {
        user.lastLoginAt = new Date();
        user.updatedAt = new Date();
      }
    }
  }

  async createSession(userId: string, refreshToken: string, expiresAt: Date, ipAddress?: string, userAgent?: string): Promise<Session> {
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          refresh_token_hash: refreshTokenHash,
          expires_at: expiresAt.toISOString(),
          ip_address: ipAddress,
          user_agent: userAgent,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        refreshTokenHash: data.refresh_token_hash,
        expiresAt: new Date(data.expires_at),
        createdAt: new Date(data.created_at),
        lastActivityAt: new Date(data.last_activity_at),
        ipAddress: data.ip_address,
        userAgent: data.user_agent,
      };
    } else {
      const session: Session = {
        id: crypto.randomUUID(),
        userId,
        refreshTokenHash,
        expiresAt,
        createdAt: new Date(),
        lastActivityAt: new Date(),
        ipAddress,
        userAgent,
      };

      this.memorySessions.set(session.id, session);
      return session;
    }
  }

  async findSessionByRefreshToken(refreshToken: string): Promise<Session | null> {
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('refresh_token_hash', refreshTokenHash)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        refreshTokenHash: data.refresh_token_hash,
        expiresAt: new Date(data.expires_at),
        createdAt: new Date(data.created_at),
        lastActivityAt: new Date(data.last_activity_at),
        ipAddress: data.ip_address,
        userAgent: data.user_agent,
      };
    } else {
      return Array.from(this.memorySessions.values()).find(s => s.refreshTokenHash === refreshTokenHash) || null;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (this.useSupabase) {
      await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId);
    } else {
      this.memorySessions.delete(sessionId);
    }
  }

  async deleteUserSessions(userId: string): Promise<void> {
    if (this.useSupabase) {
      await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId);
    } else {
      for (const [id, session] of this.memorySessions.entries()) {
        if (session.userId === userId) {
          this.memorySessions.delete(id);
        }
      }
    }
  }

  async logAuthEvent(
    eventType: 'login' | 'logout' | 'register' | 'password_reset' | 'token_refresh',
    success: boolean,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (this.useSupabase) {
      await supabase
        .from('auth_audit_logs')
        .insert({
          user_id: userId,
          event_type: eventType,
          success,
          ip_address: ipAddress,
          user_agent: userAgent,
          error_message: errorMessage,
          metadata,
        });
    } else {
      this.memoryAuditLogs.push({
        id: crypto.randomUUID(),
        userId,
        eventType,
        success,
        ipAddress,
        userAgent,
        errorMessage,
        metadata,
        createdAt: new Date(),
      });
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    if (this.useSupabase) {
      // The database function handles this automatically
      await supabase.rpc('cleanup_expired_sessions');
    } else {
      const now = new Date();
      for (const [id, session] of this.memorySessions.entries()) {
        if (session.expiresAt < now) {
          this.memorySessions.delete(id);
        }
      }
    }
  }
}
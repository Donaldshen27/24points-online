export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'worker' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
  isActive: boolean;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

export interface AuthAuditLog {
  id: string;
  userId: string;
  action: 'login' | 'logout' | 'register' | 'password_change' | 'failed_login';
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}
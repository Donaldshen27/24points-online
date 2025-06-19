// Define types locally to avoid cross-project imports
interface LoginRequest {
  email: string;
  password: string;
}

interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: string;
}

interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

class AuthService {
  private accessToken: string | null = null;
  private user: AuthUser | null = null;
  private readonly API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3024';

  constructor() {
    // Try to restore session from localStorage
    this.restoreSession();
  }

  private restoreSession() {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      this.accessToken = token;
      this.user = JSON.parse(userStr);
    }
  }

  private saveSession(token: string, user: AuthUser) {
    this.accessToken = token;
    this.user = user;
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  private clearSession() {
    this.accessToken = null;
    this.user = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }

  async login(credentials: LoginRequest): Promise<AuthUser> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // For cookies (refresh token)
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data: AuthResponse = await response.json();
      this.saveSession(data.accessToken, data.user);
      
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(data: RegisterRequest): Promise<AuthUser> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const result: AuthResponse = await response.json();
      this.saveSession(result.accessToken, result.user);
      
      return result.user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${this.API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearSession();
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!this.accessToken) {
      return null;
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        this.clearSession();
        return null;
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Get current user error:', error);
      this.clearSession();
      return null;
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && !!this.user;
  }
}

export const authService = new AuthService();
export type { AuthUser, LoginRequest, RegisterRequest };
export { AuthService };
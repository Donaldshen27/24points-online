// Define types locally to avoid cross-project imports
interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

export interface AuthUser {
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
  confirmPassword: string;
}

class AuthService {
  private accessToken: string | null = null;
  private user: AuthUser | null = null;
  private readonly API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3024';
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    // Session will be restored via the public restoreSession method
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

  async restoreSession(): Promise<User | null> {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      this.accessToken = token;
      this.user = JSON.parse(userStr);
      
      // Try to verify token is still valid, with auto-refresh
      try {
        const currentUser = await this.getCurrentUserWithRefresh();
        if (currentUser) {
          return currentUser;
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        this.clearSession();
      }
    }
    
    return null;
  }

  async login(credentials: LoginRequest): Promise<{ user: User; accessToken: string }> {
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
      
      return { user: data.user, accessToken: data.accessToken };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(data: RegisterRequest): Promise<{ user: User; accessToken: string }> {
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
      
      return { user: result.user, accessToken: result.accessToken };
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

  async refreshAccessToken(): Promise<string | null> {
    // Avoid multiple concurrent refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.API_BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include', // For cookies (refresh token)
        });

        if (!response.ok) {
          throw new Error('Failed to refresh token');
        }

        const data: AuthResponse = await response.json();
        this.saveSession(data.accessToken, data.user);
        
        return data.accessToken;
      } catch (error) {
        console.error('Token refresh error:', error);
        this.clearSession();
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    // First attempt with current token
    const makeRequest = async (token: string | null) => {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });
    };

    let response = await makeRequest(this.accessToken);

    // If we get a 401, try to refresh the token
    if (response.status === 401 && this.accessToken) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        // Retry with new token
        response = await makeRequest(newToken);
      }
    }

    return response;
  }

  // Update getCurrentUser to use fetchWithAuth
  async getCurrentUserWithRefresh(): Promise<AuthUser | null> {
    if (!this.accessToken) {
      return null;
    }

    try {
      const response = await this.fetchWithAuth(`${this.API_BASE_URL}/api/auth/me`);

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
}

export const authService = new AuthService();
export { AuthService };
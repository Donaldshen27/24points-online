import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import type { User } from '../services/authService';
import { puzzleRecordsCache, leaderboardCache } from '../services/puzzleRecordsCache';
import { guestService } from '../services/guestService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session on mount
    const initAuth = async () => {
      try {
        const restoredUser = await authService.restoreSession();
        if (restoredUser) {
          setUser(restoredUser);
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    // Clear caches when logging in (in case switching users)
    puzzleRecordsCache.clear();
    leaderboardCache.clear();
    guestService.clearGuestUsername();
    
    const { user: loggedInUser } = await authService.login({ email, password });
    setUser(loggedInUser);
  };

  const register = async (username: string, email: string, password: string) => {
    // Clear caches when registering a new account
    puzzleRecordsCache.clear();
    leaderboardCache.clear();
    guestService.clearGuestUsername();
    
    const { user: registeredUser } = await authService.register({ username, email, password });
    setUser(registeredUser);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
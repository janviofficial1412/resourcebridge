import React, { createContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, LoginCredentials, RegisterCredentials, UserResponse } from '../features/auth/authTypes';
import { authService } from '../features/auth/authService';

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<UserResponse>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on initial mount or manual refresh via GET /api/auth/me
  const restoreSession = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser({ silent: true });
      setUser({
        id: currentUser.id,
        username: currentUser.username,
        email: currentUser.email,
        fullName: currentUser.fullName,
      });
      setIsAuthenticated(true);
    } catch {
      // Unauthenticated or expired session is an expected anonymous state
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser({ silent: true });
        if (isMounted) {
          setUser({
            id: currentUser.id,
            username: currentUser.username,
            email: currentUser.email,
            fullName: currentUser.fullName,
          });
          setIsAuthenticated(true);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const loginResponse = await authService.login(credentials);
      try {
        // Attempt to fetch full user profile using newly established session
        const currentUser = await authService.getCurrentUser();
        setUser({
          id: currentUser.id,
          username: currentUser.username,
          email: currentUser.email,
          fullName: currentUser.fullName,
        });
      } catch {
        // Fallback to username from login response
        setUser({ username: loginResponse.username });
      }
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<UserResponse> => {
    setIsLoading(true);
    try {
      return await authService.register(credentials);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshSession: restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { AuthUser, LoginCredentials, RegisterCredentials, UserResponse } from '../features/auth/authTypes';
import { authService } from '../features/auth/authService';
import {
  createSingleFlight,
  requireSessionUser,
  restoreSessionUser,
} from '../features/auth/authSession';
import { ApiClientError } from '../services/api';

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
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
  const [authError, setAuthError] = useState<string | null>(null);
  const initialSessionRequestRef = useRef(createSingleFlight<AuthUser | null>());
  const authOperationRef = useRef(0);

  // Restore authenticated session on initial mount or manual refresh via GET /api/auth/me
  const restoreSession = useCallback(async () => {
    const operation = ++authOperationRef.current;
    setIsLoading(true);
    setAuthError(null);
    try {
      const currentUser = await restoreSessionUser(
        () => authService.getCurrentUser({ silent: true })
      );
      if (operation === authOperationRef.current) {
        setUser(currentUser);
        setIsAuthenticated(currentUser !== null);
      }
    } catch (error) {
      if (operation === authOperationRef.current) {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError(error instanceof ApiClientError
          ? error.message
          : 'Unable to verify your session. Please try again.');
      }
    } finally {
      if (operation === authOperationRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const operation = authOperationRef.current;
    const initialSessionRequest = initialSessionRequestRef.current(
      () => restoreSessionUser(() => authService.getCurrentUser({ silent: true }))
    );

    const initAuth = async () => {
      try {
        const currentUser = await initialSessionRequest;
        if (isMounted && operation === authOperationRef.current) {
          setUser(currentUser);
          setIsAuthenticated(currentUser !== null);
          setAuthError(null);
        }
      } catch (error) {
        if (isMounted && operation === authOperationRef.current) {
          setUser(null);
          setIsAuthenticated(false);
          setAuthError(error instanceof ApiClientError
            ? error.message
            : 'Unable to verify your session. Please try again.');
        }
      } finally {
        if (isMounted && operation === authOperationRef.current) {
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
    const operation = ++authOperationRef.current;
    setIsLoading(true);
    setAuthError(null);
    try {
      await authService.login(credentials);
      const currentUser = await requireSessionUser(() => authService.getCurrentUser());
      if (operation !== authOperationRef.current) return;
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      if (operation === authOperationRef.current) {
        setUser(null);
        setIsAuthenticated(false);
      }
      throw error;
    } finally {
      if (operation === authOperationRef.current) setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<UserResponse> => {
    const operation = ++authOperationRef.current;
    setIsLoading(true);
    try {
      return await authService.register(credentials);
    } finally {
      if (operation === authOperationRef.current) setIsLoading(false);
    }
  };

  const logout = async () => {
    const operation = ++authOperationRef.current;
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      if (operation === authOperationRef.current) {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError(null);
        setIsLoading(false);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        authError,
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

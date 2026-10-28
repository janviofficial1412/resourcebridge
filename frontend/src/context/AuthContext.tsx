import React, { createContext, useState, ReactNode } from 'react';
import { 
  AuthUser, 
  LoginCredentials, 
  RegisterCredentials, 
  UserResponse, 
  LoginResponse 
} from '../features/auth/authTypes';
import { authService } from '../features/auth/authService';

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  register: (credentials: RegisterCredentials) => Promise<UserResponse>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // In-memory authentication state (no localStorage for passwords/sessions per security rules)
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isAuthenticated = user !== null;

  const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      // The backend returns { email: "user@example.com" }
      setUser({ email: response.email });
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<UserResponse> => {
    setIsLoading(true);
    try {
      // Backend creates user in DB and returns UserResponse; session is NOT automatically created
      const response = await authService.register(credentials);
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

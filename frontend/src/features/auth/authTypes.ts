/**
 * Types specific to authentication requests, responses, and state.
 */

export interface RegisterCredentials {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export interface LoginResponse {
  email: string;
}

export interface AuthUser {
  email: string;
  fullName?: string;
  id?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

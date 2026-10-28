/**
 * Types specific to authentication requests, responses, and state.
 */

export interface RegisterCredentials {
  username: string;
  password: string;
  fullName: string;
  email?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email?: string | null;
  fullName: string;
  createdAt: string;
}

export interface LoginResponse {
  username: string;
}

export interface AuthUser {
  id?: string;
  username: string;
  email?: string | null;
  fullName?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

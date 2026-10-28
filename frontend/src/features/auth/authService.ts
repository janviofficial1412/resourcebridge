import { api } from '../../services/api';
import {
  RegisterCredentials,
  LoginCredentials,
  UserResponse,
  LoginResponse,
} from './authTypes';

export const authService = {
  /**
   * Registers a new user account with unique username and optional email.
   * Exempt from CSRF protection on backend.
   */
  async register(credentials: RegisterCredentials): Promise<UserResponse> {
    return api.post<UserResponse>('/api/auth/register', credentials, {
      skipCsrf: true,
    });
  },

  /**
   * Establishes an authenticated session using username and password.
   * Attaches X-XSRF-TOKEN CSRF header. Sets JSESSIONID cookie.
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return api.post<LoginResponse>('/api/auth/login', credentials);
  },

  /**
   * Fetches currently authenticated user public profile from active session.
   * Resolves authentication state after page refreshes.
   */
  async getCurrentUser(options?: { silent?: boolean }): Promise<UserResponse> {
    return api.get<UserResponse>('/api/auth/me', options);
  },

  /**
   * Invalidates server-side session and clears SecurityContext.
   */
  async logout(): Promise<void> {
    return api.post<void>('/api/auth/logout', {});
  },
};

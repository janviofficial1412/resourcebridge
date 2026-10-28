import { api } from '../../services/api';
import { 
  RegisterCredentials, 
  LoginCredentials, 
  UserResponse, 
  LoginResponse 
} from './authTypes';

export const authService = {
  /**
   * Registers a new user account.
   * Note: The backend explicitly exempts /api/auth/register from CSRF verification.
   * Sending credentials: "include" allows the backend to write the initial XSRF-TOKEN cookie.
   */
  async register(credentials: RegisterCredentials): Promise<UserResponse> {
    return api.post<UserResponse>('/api/auth/register', credentials, {
      skipCsrf: true,
    });
  },

  /**
   * Logs in with email and password.
   * Requires CSRF token verification (X-XSRF-TOKEN) and sets JSESSIONID session cookie.
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return api.post<LoginResponse>('/api/auth/login', credentials);
  },

  /**
   * Logs out current user.
   * Requires CSRF token verification and invalidates server-side session.
   */
  async logout(): Promise<void> {
    return api.post<void>('/api/auth/logout');
  },
};

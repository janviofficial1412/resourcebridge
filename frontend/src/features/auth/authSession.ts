import { AuthUser, UserResponse } from './authTypes';
import { ApiClientError } from '../../services/api';

export class SessionEstablishmentError extends Error {
  constructor() {
    super('Sign-in succeeded, but the server did not restore the authenticated session. Please try again.');
    this.name = 'SessionEstablishmentError';
  }
}

export function createSingleFlight<T>() {
  let request: Promise<T> | null = null;
  return (load: () => Promise<T>): Promise<T> => {
    request ??= load();
    return request;
  };
}

export function toAuthUser(user: UserResponse): AuthUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
  };
}

export async function restoreSessionUser(
  getCurrentUser: () => Promise<UserResponse>
): Promise<AuthUser | null> {
  try {
    return toAuthUser(await getCurrentUser());
  } catch (error) {
    if (error instanceof ApiClientError && error.isAuthError) {
      return null;
    }
    throw error;
  }
}

export async function requireSessionUser(
  getCurrentUser: () => Promise<UserResponse>
): Promise<AuthUser> {
  try {
    return toAuthUser(await getCurrentUser());
  } catch (error) {
    if (error instanceof ApiClientError && error.isAuthError) {
      throw new SessionEstablishmentError();
    }
    throw error;
  }
}

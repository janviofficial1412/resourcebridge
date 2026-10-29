import { describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '../../services/api';
import type { AuthUser } from './authTypes';
import {
  createSingleFlight,
  requireSessionUser,
  restoreSessionUser,
  SessionEstablishmentError,
} from './authSession';

const user = {
  id: 'user-id',
  username: 'student',
  email: 'student@example.edu',
  fullName: 'Test Student',
  createdAt: '2026-10-29T00:00:00Z',
};

describe('session restoration', () => {
  it('shares one initial request across repeated mount effects', async () => {
    const load = vi.fn().mockResolvedValue(null);
    const loadInitialSession = createSingleFlight<AuthUser | null>();

    const first = loadInitialSession(load);
    const second = loadInitialSession(load);

    expect(second).toBe(first);
    await expect(second).resolves.toBeNull();
    expect(load).toHaveBeenCalledOnce();
  });

  it('treats a 401 without an established session as an expected anonymous state', async () => {
    const getCurrentUser = vi.fn().mockRejectedValue(
      new ApiClientError(401, 'Unauthorized', 'Unauthenticated session')
    );

    await expect(restoreSessionUser(getCurrentUser)).resolves.toBeNull();
    expect(getCurrentUser).toHaveBeenCalledOnce();
  });

  it('surfaces server failures rather than treating them as anonymous', async () => {
    const error = new ApiClientError(503, 'Service Unavailable', 'Identity service unavailable');
    await expect(restoreSessionUser(() => Promise.reject(error))).rejects.toBe(error);
  });

  it('only establishes login state after the authenticated profile is restored', async () => {
    await expect(requireSessionUser(() => Promise.resolve(user))).resolves.toMatchObject({
      id: user.id,
      username: user.username,
    });

    await expect(requireSessionUser(() => Promise.reject(
      new ApiClientError(401, 'Unauthorized', 'Unauthenticated session')
    ))).rejects.toBeInstanceOf(SessionEstablishmentError);
  });
});

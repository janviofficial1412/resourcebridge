import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('cross-origin CSRF token retrieval', () => {
  it('reads and reuses the token exposed by the credentialed CSRF probe', async () => {
    vi.stubGlobal('document', { cookie: '' } as Document);
    const fetchMock = vi.fn().mockResolvedValue({
      headers: { get: (name: string) => name === 'X-CSRF-TOKEN' ? 'csrf-token' : null },
    });
    vi.stubGlobal('fetch', fetchMock);

    const { ensureCsrfToken, getCsrfHeader } = await import('./csrf');

    await expect(ensureCsrfToken('https://api.example.test')).resolves.toBe('csrf-token');
    await expect(getCsrfHeader('https://api.example.test')).resolves.toEqual({
      'X-XSRF-TOKEN': 'csrf-token',
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/auth/csrf',
      expect.objectContaining({ credentials: 'include' })
    );
  });
});

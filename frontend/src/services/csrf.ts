/**
 * Reusable CSRF Token utility for Spring Security integration.
 *
 * Spring Security's CookieCsrfTokenRepository sets the cookie "XSRF-TOKEN" (withHttpOnlyFalse).
 * Mutating requests (POST, PUT, DELETE, PATCH) must echo this value in the "X-XSRF-TOKEN" header.
 */

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
export const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';

/**
 * Extracts the XSRF-TOKEN from browser cookies.
 */
export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CSRF_COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Ensures a valid CSRF token is present in cookies before initiating state-changing requests.
 * If not present, sends a probe request to trigger Spring Security's CsrfCookieFilter.
 */
export async function ensureCsrfToken(baseUrl: string = ''): Promise<string> {
  const existingToken = getCsrfTokenFromCookie();
  if (existingToken) {
    return existingToken;
  }

  // Probe request to trigger CsrfCookieFilter on the backend
  try {
    const probeUrl = `${baseUrl}/api/auth/login`;
    await fetch(probeUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json, text/plain, */*',
      },
    });
  } catch {
    // Network errors will be handled when the actual mutation request runs
  }

  const tokenAfterProbe = getCsrfTokenFromCookie();
  if (!tokenAfterProbe) {
    // If the cookie wasn't set, return empty string so request proceeds and server gives explicit 403 or error
    return '';
  }

  return tokenAfterProbe;
}

/**
 * Returns header object with X-XSRF-TOKEN if token exists or can be obtained.
 */
export async function getCsrfHeader(baseUrl: string = ''): Promise<Record<string, string>> {
  const token = await ensureCsrfToken(baseUrl);
  if (token) {
    return { [CSRF_HEADER_NAME]: token };
  }
  return {};
}

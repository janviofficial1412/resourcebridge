/**
 * Shared API client for ResourceBridge.
 * Enforces credentials: "include", consistent JSON parsing,
 * CSRF token attachment for mutating requests, and normalized error throwing.
 */

import { getCsrfHeader } from './csrf';
import { ApiError, FieldProblem } from '../types';

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly error: string;
  public readonly fieldErrors: FieldProblem[];
  public readonly isNetworkError: boolean;

  constructor(
    status: number,
    error: string,
    message: string,
    fieldErrors: FieldProblem[] = [],
    isNetworkError: boolean = false
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.error = error;
    this.fieldErrors = fieldErrors;
    this.isNetworkError = isNetworkError;
  }

  get isAuthError(): boolean {
    return this.status === 401;
  }

  get isCsrfError(): boolean {
    return this.status === 403;
  }

  get isConflict(): boolean {
    return this.status === 409;
  }

  get isValidationError(): boolean {
    return this.status === 400 && this.fieldErrors.length > 0;
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipCsrf?: boolean;
  silent?: boolean;
}

const RAW_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080';
// Remove trailing slash if present
export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

/**
 * Resolves full API URL with base path.
 */
function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

/**
 * Primary request function.
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    skipCsrf = false,
    ...customConfig
  } = options;

  const url = buildUrl(path);
  const normalizedMethod = method.toUpperCase();
  const isMutating = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(normalizedMethod);

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string>),
  };

  // Add Content-Type if body is present and not FormData
  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  // Attach CSRF header for state-changing requests unless explicitly skipped
  if (isMutating && !skipCsrf) {
    const csrfHeaders = await getCsrfHeader(API_BASE_URL);
    Object.assign(requestHeaders, csrfHeaders);
  }

  const config: RequestInit = {
    method: normalizedMethod,
    headers: requestHeaders,
    credentials: 'include', // Always send and receive JSESSIONID & XSRF-TOKEN
    ...customConfig,
  };

  if (body !== undefined) {
    config.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    const networkMsg = err instanceof Error ? err.message : 'Network request failed';
    throw new ApiClientError(
      0,
      'NetworkError',
      `Unable to connect to server at ${API_BASE_URL}. (${networkMsg})`,
      [],
      true
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  // Parse response body safely
  let responseData: unknown = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    try {
      responseData = await response.text();
    } catch {
      responseData = null;
    }
  }

  // Success (2xx)
  if (response.ok) {
    return responseData as T;
  }

  // Process standard backend ApiError shape
  let errorTitle = response.statusText || 'Error';
  let errorMessage = `Request failed with status ${response.status}`;
  let fieldErrors: FieldProblem[] = [];

  if (responseData && typeof responseData === 'object') {
    const apiErr = responseData as Partial<ApiError>;
    if (apiErr.error) errorTitle = apiErr.error;
    if (apiErr.message) errorMessage = apiErr.message;
    if (Array.isArray(apiErr.fieldErrors)) {
      fieldErrors = apiErr.fieldErrors;
    }
  } else if (typeof responseData === 'string' && responseData.trim().length > 0) {
    errorMessage = responseData;
  }

  // Specialized messaging for standard HTTP codes if backend returned bare code
  if (response.status === 401 && (!responseData || errorMessage.includes('Request failed'))) {
    errorMessage = 'Authentication required or session expired';
  } else if (response.status === 403 && (!responseData || errorMessage.includes('Request failed'))) {
    errorMessage = 'Forbidden: CSRF token verification failed or session expired';
  }

  throw new ApiClientError(
    response.status,
    errorTitle,
    errorMessage,
    fieldErrors,
    false
  );
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
};

import { TOKEN_STORAGE_KEY } from '../config/index.ts';

/** Error thrown for any non-2xx response from the BFF. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function authHeaders(): Record<string, string> {
  if (typeof localStorage === 'undefined') return {};
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface ApiRequestOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

async function request<T>(
  path: string,
  init: RequestInit,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    signal: options.signal,
    headers: {
      Accept: 'application/json',
      ...authHeaders(),
      ...init.headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }
    throw new ApiError(response.status, `Request to ${path} failed with ${response.status}`, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

/** Thin typed GET against the BFF. */
export function apiGet<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return request<T>(path, { method: 'GET' }, options);
}

/** Thin typed POST (JSON body) against the BFF. */
export function apiPost<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
  return request<T>(
    path,
    {
      method: 'POST',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    options,
  );
}

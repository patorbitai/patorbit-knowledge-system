const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Module-level token storage — avoids stale closure issues in React hooks
let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? 'Request failed');
  }
  return res.json();
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
  options?: { signal?: AbortSignal },
): Promise<T> {
  const authHeaders: Record<string, string> = {};
  if (_accessToken) {
    authHeaders['Authorization'] = `Bearer ${_accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(headers ?? {}),
      ...authHeaders,
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  });
  return handleResponse<T>(res);
}

export type ApiOptions = { signal?: AbortSignal };

type RequestFn = <T>(
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
  options?: ApiOptions,
) => Promise<T>;

export const api = {
  post: (<T>(
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
    options?: ApiOptions,
  ) => request<T>('POST', path, body, headers, options)) as RequestFn,
  get: (<T>(
    path: string,
    params?: Record<string, any> | Record<string, string>,
    headers?: Record<string, string>,
    options?: ApiOptions,
  ) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return request<T>('GET', `${path}${query}`, undefined, headers, options);
  }) as <T>(
    path: string,
    params?: Record<string, any>,
    headers?: Record<string, string>,
    options?: ApiOptions,
  ) => Promise<T>,
  patch: (<T>(
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
    options?: ApiOptions,
  ) => request<T>('PATCH', path, body, headers, options)) as RequestFn,
  del: (<T>(path: string, headers?: Record<string, string>, options?: ApiOptions) =>
    request<T>('DELETE', path, undefined, headers, options)) as RequestFn,
};

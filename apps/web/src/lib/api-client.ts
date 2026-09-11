import type { ApiResponse } from '@velure/contracts';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {},
): Promise<ApiResponse<T>> {
  const { accessToken, ...init } = options;
  const headers = new Headers(init.headers);

  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  const json = (await response.json()) as ApiResponse<T>;

  if (!response.ok || json.error) {
    throw new ApiClientError(
      json.error?.message ?? 'Request failed',
      json.error?.code ?? 'UNKNOWN',
      response.status,
    );
  }

  return json;
}

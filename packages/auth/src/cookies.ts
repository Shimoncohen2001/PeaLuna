import { REFRESH_TOKEN_TTL_SECONDS } from '@velure/contracts';

export const REFRESH_COOKIE_NAME = 'pealuna_refresh_token';

export interface RefreshCookieOptions {
  secure: boolean;
  domain?: string;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * HttpOnly refresh token cookie — access token returned in JSON for web + mobile.
 * Mobile apps can use Authorization header only and store refresh securely (Keychain).
 */
export function buildRefreshCookie(
  refreshToken: string,
  options: RefreshCookieOptions,
): string {
  const maxAge = REFRESH_TOKEN_TTL_SECONDS;
  const parts = [
    `${REFRESH_COOKIE_NAME}=${encodeURIComponent(refreshToken)}`,
    'Path=/api/v1/auth',
    'HttpOnly',
    `Max-Age=${maxAge}`,
    `SameSite=${options.sameSite ?? 'lax'}`,
  ];

  if (options.secure) {
    parts.push('Secure');
  }

  if (options.domain) {
    parts.push(`Domain=${options.domain}`);
  }

  return parts.join('; ');
}

export function clearRefreshCookie(options: RefreshCookieOptions): string {
  const parts = [
    `${REFRESH_COOKIE_NAME}=`,
    'Path=/api/v1/auth',
    'HttpOnly',
    'Max-Age=0',
    `SameSite=${options.sameSite ?? 'lax'}`,
  ];

  if (options.secure) {
    parts.push('Secure');
  }

  if (options.domain) {
    parts.push(`Domain=${options.domain}`);
  }

  return parts.join('; ');
}

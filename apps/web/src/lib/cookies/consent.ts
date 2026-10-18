export const COOKIE_CONSENT_KEY = 'pealuna.cookieConsent';
export const COOKIE_CONSENT_COOKIE = 'pealuna_cookie_consent';
export const COOKIE_CONSENT_VERSION = 1;
export const COOKIE_CONSENT_EVENT = 'pealuna:cookie-consent';

const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type CookieConsent = {
  v: number;
  essential: true;
  acceptedAt: string;
};

export function parseCookieConsent(raw: string | null | undefined): CookieConsent | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed?.v !== COOKIE_CONSENT_VERSION || parsed.essential !== true) return null;
    if (typeof parsed.acceptedAt !== 'string' || !parsed.acceptedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function readConsentCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${COOKIE_CONSENT_COOKIE}=`)) {
      return decodeURIComponent(trimmed.slice(COOKIE_CONSENT_COOKIE.length + 1));
    }
  }
  return null;
}

function writeConsentCookie(raw: string) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE_CONSENT_COOKIE}=${encodeURIComponent(raw)}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const fromStorage = parseCookieConsent(window.localStorage.getItem(COOKIE_CONSENT_KEY));
    if (fromStorage) return fromStorage;
  } catch {
    /* private mode / blocked storage */
  }
  try {
    return parseCookieConsent(readConsentCookie());
  } catch {
    return null;
  }
}

export function writeCookieConsent(): CookieConsent {
  const value: CookieConsent = {
    v: COOKIE_CONSENT_VERSION,
    essential: true,
    acceptedAt: new Date().toISOString(),
  };
  const raw = JSON.stringify(value);
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, raw);
  } catch {
    /* persist via essential cookie instead */
  }
  try {
    writeConsentCookie(raw);
  } catch {
    /* still notify listeners so the UI can close */
  }
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
  return value;
}

export function safeReturnPath(next: string | null | undefined): string | null {
  if (!next?.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return null;
  if (next === '/cookies' || next.startsWith('/cookies?') || next.startsWith('/cookies#')) {
    return null;
  }
  return next;
}

export function cookiePolicyHref(returnTo: string): string {
  const next = safeReturnPath(returnTo);
  if (!next) return '/cookies';
  return `/cookies?next=${encodeURIComponent(next)}`;
}

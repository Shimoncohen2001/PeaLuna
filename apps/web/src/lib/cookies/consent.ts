export const COOKIE_CONSENT_KEY = 'pealuna.cookieConsent';
export const COOKIE_CONSENT_VERSION = 1;
export const COOKIE_CONSENT_EVENT = 'pealuna:cookie-consent';

export type CookieConsent = {
  v: number;
  essential: true;
  acceptedAt: string;
};

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed?.v !== COOKIE_CONSENT_VERSION || parsed.essential !== true) return null;
    return parsed;
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
  window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(value));
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
  return value;
}

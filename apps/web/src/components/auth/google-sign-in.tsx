'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiClientError, apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { COOKIE_CONSENT_EVENT, readCookieConsent } from '@/lib/cookies/consent';
import { useLocale } from '@/lib/i18n/locale';

type GoogleCredentialResponse = { credential: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            ux_mode?: 'popup' | 'redirect';
            auto_select?: boolean;
            context?: string;
          }) => void;
          renderButton: (
            el: HTMLElement,
            opts: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              width?: number;
              locale?: string;
            },
          ) => void;
        };
      };
    };
  }
}

export function GoogleSignInButton({ onError }: { onError: (message: string) => void }) {
  const { t, locale } = useLocale();
  const { loginWithGoogle } = useAuth();
  const [clientId, setClientId] = useState<string | null | undefined>(undefined);
  const [scriptReady, setScriptReady] = useState(false);
  const [consentOk, setConsentOk] = useState(false);
  const [pending, setPending] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setConsentOk(!!readCookieConsent());
    sync();
    window.addEventListener(COOKIE_CONSENT_EVENT, sync);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, sync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ googleClientId: string | null }>('/api/v1/auth/sso')
      .then((res) => {
        if (!cancelled) setClientId(res.data?.googleClientId ?? null);
      })
      .catch(() => {
        if (!cancelled) setClientId(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCredential = useCallback(
    async (idToken: string) => {
      setPending(true);
      try {
        await loginWithGoogle(idToken);
      } catch (err) {
        onError(err instanceof ApiClientError ? err.message : t.auth.googleError);
      } finally {
        setPending(false);
      }
    },
    [loginWithGoogle, onError, t.auth.googleError],
  );

  useEffect(() => {
    if (!consentOk || !clientId || !scriptReady || !btnRef.current || !window.google?.accounts?.id) {
      return;
    }
    const host = btnRef.current;
    const width = Math.min(400, Math.max(240, host.clientWidth || 320));
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        void handleCredential(response.credential);
      },
      ux_mode: 'popup',
      auto_select: false,
    });
    host.replaceChildren();
    window.google.accounts.id.renderButton(host, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width,
      locale: locale === 'he' ? 'he' : locale,
    });
  }, [consentOk, clientId, scriptReady, locale, handleCredential]);

  if (!clientId) return null;

  return (
    <div className="mb-6 space-y-3">
      {consentOk ? (
        <>
          <Script
            src="https://accounts.google.com/gsi/client"
            strategy="afterInteractive"
            onLoad={() => setScriptReady(true)}
          />
          <div ref={btnRef} className="flex min-h-11 w-full justify-center" />
          {pending ? <p className="text-center text-sm text-muted">{t.auth.submitting}</p> : null}
          <p className="text-center text-xs text-muted">{t.auth.googleTerms}</p>
        </>
      ) : null}
      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
        <span className="h-px flex-1 bg-ink/10" />
        {t.auth.orEmail}
        <span className="h-px flex-1 bg-ink/10" />
      </div>
    </div>
  );
}

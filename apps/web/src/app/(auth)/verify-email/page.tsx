'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ApiClientError, apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { postAuthPath } from '@/lib/home-path';
import { useLocale } from '@/lib/i18n/locale';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get('token');
  const { t } = useLocale();
  const { authFetch, isAuthenticated, user, refreshSession } = useAuth();
  const [status, setStatus] = useState<'pending' | 'ok' | 'error'>(
    user?.emailVerified ? 'ok' : 'pending',
  );
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const [mailError, setMailError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.emailVerified) setStatus('ok');
  }, [user?.emailVerified]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        await apiFetch('/api/v1/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ token }),
        });
        if (!cancelled) {
          setStatus('ok');
          try {
            await refreshSession();
          } catch {
            /* session may still refresh on next load */
          }
        }
      } catch {
        if (!cancelled) {
          setStatus('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, refreshSession]);

  async function resend() {
    setResending(true);
    setResent(false);
    setMailError(null);
    try {
      await authFetch('/api/v1/auth/resend-verification', { method: 'POST' });
      setResent(true);
      setStatus('pending');
    } catch (err) {
      setMailError(err instanceof ApiClientError ? err.message : t.auth.verifyError);
    } finally {
      setResending(false);
    }
  }

  const nextHref = postAuthPath({ ...user, emailVerified: true }, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blush/30 to-warm-white px-6 py-12">
      <div className="w-full max-w-md rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-8 shadow-elevated">
        <div dir="ltr" className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>
        <h1 className="font-display text-3xl text-ink">{t.auth.verifyTitle}</h1>
        <p className="mt-3 text-sm text-muted">
          {status === 'ok'
            ? t.auth.verifySuccess
            : status === 'error'
              ? t.auth.verifyError
              : t.auth.verifyPending}
        </p>
        {user?.email ? (
          <p className="mt-2 text-sm font-medium text-ink">{user.email}</p>
        ) : null}
        {resent ? <p className="mt-2 text-sm text-champagne">{t.auth.resent}</p> : null}
        {mailError ? <p className="mt-2 text-sm text-red-700">{mailError}</p> : null}
        <div className="mt-8 flex flex-col gap-3">
          {status === 'ok' ? (
            <Link href={nextHref}>
              <Button type="button" variant="gold" className="w-full">
                {t.auth.verifyCta}
              </Button>
            </Link>
          ) : isAuthenticated ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={resending}
              onClick={() => void resend()}
            >
              {resending ? t.auth.resending : t.auth.resend}
            </Button>
          ) : (
            <Link href="/login">
              <Button type="button" variant="secondary" className="w-full">
                {t.auth.submit}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}

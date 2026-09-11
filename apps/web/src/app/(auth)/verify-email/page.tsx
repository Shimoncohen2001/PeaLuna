'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get('token');
  const { t } = useLocale();
  const { authFetch, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<'pending' | 'ok' | 'error'>('pending');
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

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
  }, [token]);

  async function resend() {
    setResending(true);
    setResent(false);
    try {
      await authFetch('/api/v1/auth/resend-verification', { method: 'POST' });
      setResent(true);
    } catch {
      setStatus('error');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blush/30 to-warm-white px-6 py-12">
      <div className="w-full max-w-md rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-8 shadow-elevated">
        <h1 className="font-display text-3xl text-ink">{t.auth.verifyTitle}</h1>
        <p className="mt-3 text-sm text-muted">
          {status === 'ok' ? t.auth.verifySuccess : status === 'error' ? t.auth.verifyError : t.auth.verifyPending}
        </p>
        {resent ? <p className="mt-2 text-sm text-champagne">{t.auth.resent}</p> : null}
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/dashboard">
            <Button type="button" variant="gold" className="w-full">
              {t.auth.verifyCta}
            </Button>
          </Link>
          {isAuthenticated && status !== 'ok' ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={resending}
              onClick={() => void resend()}
            >
              {resending ? t.auth.resending : t.auth.resend}
            </Button>
          ) : null}
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

'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { homePathForRoles } from '@/lib/home-path';
import { useLocale } from '@/lib/i18n/locale';

const DEMO_ADMIN = { email: 'admin@pealuna.demo', password: 'DemoAdmin123' };
const DEMO_EXPERT = { email: 'amina@pealuna.demo', password: 'DemoExpert123' };
const showDemoLogin =
  process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login, isAuthenticated, isLoading, user } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const next = searchParams.get('next');
      const safeNext = next?.startsWith('/') && !next.startsWith('//') ? next : null;
      router.replace(safeNext ?? homePathForRoles(user?.roles));
    }
  }, [isAuthenticated, isLoading, router, searchParams, user?.roles]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t.auth.error);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blush/30 to-warm-white px-4 py-8 sm:px-6">
      <div className="w-full max-w-md rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-5 shadow-elevated sm:p-8">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>
        <h1 className="font-display text-3xl text-ink">{t.auth.title}</h1>
        <p className="mt-2 text-sm text-muted">{t.auth.subtitle}</p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink">
              {t.auth.email}
            </label>
            <input
              id="email"
              name="email"
              type="text"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/10 bg-warm-white px-4 py-2.5 text-ink focus:border-champagne"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink">
              {t.auth.password}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/10 bg-warm-white px-4 py-2.5 text-ink focus:border-champagne"
            />
          </div>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <Button type="submit" variant="primary" className="w-full" disabled={pending}>
            {pending ? t.auth.submitting : t.auth.submit}
          </Button>
        </form>

        {showDemoLogin ? (
          <div className="mt-6 rounded-xl border border-ink/5 bg-beige/40 p-4 text-sm">
            <p className="font-medium text-ink">{t.auth.demoTitle}</p>
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                className="rounded-lg border border-ink/10 bg-warm-white px-3 py-2 text-left hover:border-champagne/50"
                onClick={() => {
                  setEmail(DEMO_ADMIN.email);
                  setPassword(DEMO_ADMIN.password);
                  setError(null);
                }}
              >
                <span className="block text-xs uppercase tracking-wide text-champagne">
                  {t.auth.demoAdmin}
                </span>
                <span className="text-ink">{DEMO_ADMIN.email}</span>
                <span className="block text-muted">{DEMO_ADMIN.password}</span>
              </button>
              <button
                type="button"
                className="rounded-lg border border-ink/10 bg-warm-white px-3 py-2 text-left hover:border-champagne/50"
                onClick={() => {
                  setEmail(DEMO_EXPERT.email);
                  setPassword(DEMO_EXPERT.password);
                  setError(null);
                }}
              >
                <span className="block text-xs uppercase tracking-wide text-champagne">
                  {t.auth.demoExpert}
                </span>
                <span className="text-ink">{DEMO_EXPERT.email}</span>
                <span className="block text-muted">{DEMO_EXPERT.password}</span>
              </button>
            </div>
          </div>
        ) : null}

        <p className="mt-6 text-center text-sm text-muted">
          {t.auth.noAccount}{' '}
          <Link href="/register" className="text-champagne hover:underline">
            {t.auth.createOne}
          </Link>
        </p>
      </div>
    </div>
  );
}

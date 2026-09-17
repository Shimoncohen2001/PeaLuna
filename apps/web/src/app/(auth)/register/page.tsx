'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';

export default function RegisterPage() {
  const { register, isAuthenticated, isLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !justRegistered) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router, justRegistered]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    try {
      await register({
        firstName: String(form.get('firstName')),
        lastName: String(form.get('lastName')),
        email: String(form.get('email')),
        password: String(form.get('password')),
        countryCode: 'IL',
      });
      setJustRegistered(true);
      router.replace('/verify-email');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t.auth.registerError);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blush/30 to-warm-white px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-md rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-5 shadow-elevated sm:p-8">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>
        <h1 className="font-display text-3xl text-ink">{t.auth.joinTitle}</h1>
        <p className="mt-2 text-sm text-muted">{t.auth.joinSubtitle}</p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium">
                {t.auth.firstName}
              </label>
              <input
                id="firstName"
                name="firstName"
                required
                className="mt-1 w-full rounded-lg border border-ink/10 px-4 py-2.5"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium">
                {t.auth.lastName}
              </label>
              <input
                id="lastName"
                name="lastName"
                required
                className="mt-1 w-full rounded-lg border border-ink/10 px-4 py-2.5"
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              {t.auth.email}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-ink/10 px-4 py-2.5"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              {t.auth.password}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={12}
              className="mt-1 w-full rounded-lg border border-ink/10 px-4 py-2.5"
            />
            <p className="mt-1 text-xs text-muted">{t.auth.passwordHint}</p>
          </div>
          <label className="flex items-start gap-2 text-sm text-muted">
            <input name="acceptTerms" type="checkbox" required className="mt-1" />
            <span>{t.auth.terms}</span>
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <Button type="submit" variant="gold" className="w-full" disabled={pending}>
            {pending ? t.auth.creating : t.auth.createAccount}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          {t.auth.hasAccount}{' '}
          <Link href="/login" className="text-champagne hover:underline">
            {t.auth.submit}
          </Link>
        </p>
      </div>
    </div>
  );
}

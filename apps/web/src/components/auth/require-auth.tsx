'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const needsVerify = Boolean(user && user.emailVerified === false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (needsVerify) {
      router.replace('/verify-email');
    }
  }, [isAuthenticated, isLoading, needsVerify, router]);

  if (isLoading || !isAuthenticated || needsVerify) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-white text-muted">
        {t.common.loading}
      </div>
    );
  }

  return <>{children}</>;
}

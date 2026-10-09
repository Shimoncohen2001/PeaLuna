'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN');
  const needsVerify = Boolean(user && user.emailVerified === false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login?next=/admin');
      return;
    }
    if (needsVerify) {
      router.replace('/verify-email');
      return;
    }
    if (!isAdmin) router.replace('/dashboard');
  }, [isAdmin, isAuthenticated, isLoading, needsVerify, router]);

  if (isLoading || !isAuthenticated || needsVerify || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-white text-muted">
        {t.common.loading}
      </div>
    );
  }

  return <>{children}</>;
}

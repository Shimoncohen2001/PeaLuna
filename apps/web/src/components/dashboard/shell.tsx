'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';

export function DashboardShell({
  children,
  variant = 'customer',
}: {
  children: React.ReactNode;
  variant?: 'customer' | 'pro';
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLocale();
  const isPro = user?.roles?.includes('TECHNICIAN');
  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN');

  const customerNav = [
    { href: '/dashboard', label: t.nav.overview },
    { href: '/dashboard/book', label: t.nav.book },
    { href: '/dashboard/wigs', label: t.nav.myWigs },
    { href: '/dashboard/orders', label: t.nav.myAppointments },
    ...(isAdmin
      ? [
          { href: '/admin/technicians', label: t.nav.adminExperts },
          { href: '/admin/services', label: t.nav.admin },
        ]
      : []),
  ];

  const proNav = [
    { href: '/pro', label: t.nav.proDashboard },
    { href: '/pro/orders', label: t.nav.proOrders },
    { href: '/pro/clients', label: t.nav.clients },
    { href: '/pro/reviews', label: t.nav.reviews },
    { href: '/pro/availability', label: t.nav.availability },
    { href: '/pro/apply', label: t.nav.myProfile },
  ];

  const nav = variant === 'pro' ? proNav : customerNav;

  return (
    <div
      className={cn(
        'min-h-screen',
        variant === 'pro'
          ? 'bg-[#1a1214] text-[#f7efe8]'
          : 'bg-gradient-to-b from-blush/20 to-warm-white text-ink',
      )}
    >
      <header
        className={cn(
          'border-b backdrop-blur-md',
          variant === 'pro' ? 'border-white/10 bg-[#120d0f]/80' : 'border-ink/5 bg-warm-white/80',
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href={variant === 'pro' ? '/pro' : '/dashboard'}
            className={cn('font-display text-2xl', variant === 'pro' ? 'text-[#e8b4a2]' : 'text-ink')}
          >
            {t.brand}
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant={variant === 'pro' ? 'dark' : 'light'} />
            {variant === 'customer' && isAdmin ? (
              <Link href="/admin" className="text-sm text-champagne hover:underline">
                {t.nav.admin}
              </Link>
            ) : null}
            {variant === 'customer' && isPro ? (
              <Link href="/pro" className="text-sm text-champagne hover:underline">
                {t.nav.proSpace}
              </Link>
            ) : null}
            {variant === 'pro' ? (
              <Link href="/dashboard" className="text-sm text-[#e8b4a2] hover:underline">
                {t.nav.clientSpace}
              </Link>
            ) : null}
            <span
              className={cn(
                'hidden text-sm sm:inline',
                variant === 'pro' ? 'text-white/60' : 'text-muted',
              )}
            >
              {user?.firstName} {user?.lastName}
            </span>
            <Button
              variant={variant === 'pro' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => void logout()}
            >
              {t.nav.logout}
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 md:grid-cols-[200px_1fr]">
        <nav className="flex flex-row gap-2 overflow-x-auto md:flex-col" aria-label="Dashboard">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors',
                  variant === 'pro'
                    ? active
                      ? 'bg-[#e8b4a2] text-[#1a1214]'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                    : active
                      ? 'bg-ink text-warm-white'
                      : 'text-muted hover:bg-beige/60 hover:text-ink',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main>{children}</main>
      </div>
    </div>
  );
}

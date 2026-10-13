'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const isPro = user?.roles?.includes('TECHNICIAN');
  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN');
  const isProTheme = variant === 'pro';

  const customerNav = [
    { href: '/dashboard', label: t.nav.overview },
    { href: '/dashboard/book', label: t.nav.book },
    { href: '/dashboard/wigs', label: t.nav.myWigs },
    { href: '/dashboard/orders', label: t.nav.myAppointments },
    ...(isAdmin
      ? [
          { href: '/admin', label: t.nav.adminHome },
          { href: '/admin/customers', label: t.nav.adminCustomers },
          { href: '/admin/technicians', label: t.nav.adminExperts },
          { href: '/admin/services', label: t.admin.services },
          { href: '/admin/skills', label: t.nav.adminSkills },
          { href: '/admin/workflow', label: t.nav.adminWorkflow },
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

  const nav = isProTheme ? proNav : customerNav;
  const spaceHref = isProTheme ? '/dashboard' : '/pro';
  const spaceLabel = isProTheme ? t.nav.clientSpace : t.nav.proSpace;
  const showSpaceSwitch = isProTheme || isPro;

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const linkTone = isProTheme
    ? 'text-[#e8b4a2] hover:underline'
    : 'text-champagne hover:underline';

  return (
    <div
      className={cn(
        'min-h-screen',
        isProTheme
          ? 'bg-[#1a1214] text-[#f7efe8]'
          : 'bg-gradient-to-b from-blush/20 to-warm-white text-ink',
      )}
    >
      <header
        className={cn(
          'sticky top-0 z-40 border-b backdrop-blur-md pt-[env(safe-area-inset-top)]',
          isProTheme ? 'border-white/10 bg-[#120d0f]/90' : 'border-ink/5 bg-warm-white/90',
        )}
      >
        <div
          dir="ltr"
          className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6 md:h-16 md:py-0"
        >
          <Link
            href={isProTheme ? '/pro' : '/dashboard'}
            className={cn(
              'shrink-0 font-display text-xl sm:text-2xl',
              isProTheme ? 'text-[#e8b4a2]' : 'text-ink',
            )}
          >
            {t.brand}
          </Link>

          {showSpaceSwitch ? (
            <Link
              href={spaceHref}
              className={cn(
                'min-w-0 truncate rounded-full px-3 py-2 text-sm font-medium md:hidden',
                isProTheme ? 'bg-white/10 text-[#e8b4a2]' : 'bg-blush/80 text-ink',
              )}
            >
              {spaceLabel}
            </Link>
          ) : null}

          <div className="ml-auto hidden min-w-0 items-center justify-end gap-3 md:flex">
            {variant === 'customer' && isAdmin ? (
              <Link href="/admin" className={cn('text-sm', linkTone)}>
                {t.nav.admin}
              </Link>
            ) : null}
            {showSpaceSwitch ? (
              <Link href={spaceHref} className={cn('text-sm', linkTone)}>
                {spaceLabel}
              </Link>
            ) : null}
            <span
              className={cn(
                'hidden text-sm lg:inline',
                isProTheme ? 'text-white/60' : 'text-muted',
              )}
            >
              {user?.firstName} {user?.lastName}
            </span>
            <Button
              variant={isProTheme ? 'secondary' : 'ghost'}
              size="sm"
              className="shrink-0"
              onClick={() => void logout()}
            >
              {t.nav.logout}
            </Button>
            <LanguageSwitcher />
          </div>

          <button
            type="button"
            className={cn(
              'ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full md:hidden',
              isProTheme ? 'bg-white/10 text-[#f7efe8]' : 'bg-ink/5 text-ink',
            )}
            aria-expanded={menuOpen}
            aria-controls="dashboard-mobile-menu"
            aria-label={menuOpen ? t.nav.closeMenu : t.nav.menu}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen ? (
          <div
            id="dashboard-mobile-menu"
            className={cn(
              'border-t px-4 py-4 md:hidden',
              isProTheme ? 'border-white/10 bg-[#120d0f]' : 'border-ink/5 bg-warm-white',
            )}
          >
            <p className={cn('mb-3 text-sm', isProTheme ? 'text-white/60' : 'text-muted')}>
              {user?.firstName} {user?.lastName}
            </p>
            <div className="flex flex-col gap-1">
              {showSpaceSwitch ? (
                <Link
                  href={spaceHref}
                  className={cn(
                    'rounded-lg px-3 py-3 text-sm font-medium',
                    isProTheme ? 'bg-white/10 text-[#e8b4a2]' : 'bg-blush/70 text-ink',
                  )}
                >
                  {spaceLabel}
                </Link>
              ) : null}
              {variant === 'customer' && isAdmin ? (
                <Link href="/admin" className={navItemClass(false, isProTheme)}>
                  {t.nav.admin}
                </Link>
              ) : null}
              {nav.map((item) => {
                const active = isNavActive(pathname, item.href);
                return (
                  <Link key={item.href} href={item.href} className={navItemClass(active, isProTheme)}>
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <LanguageSwitcher />
              <Button
                variant={isProTheme ? 'secondary' : 'ghost'}
                className="w-full"
                onClick={() => void logout()}
              >
                {t.nav.logout}
              </Button>
            </div>
          </div>
        ) : null}
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 sm:py-8 md:grid-cols-[200px_1fr] md:gap-8">
        <nav
          className="-mx-4 hidden flex-row gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex md:flex-col md:overflow-visible md:px-0 md:pb-0"
          aria-label="Dashboard"
        >
          {nav.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link key={item.href} href={item.href} className={navItemClass(active, isProTheme)}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

function isNavActive(pathname: string, href: string) {
  if (href === '/admin' || href === '/dashboard' || href === '/pro') {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navItemClass(active: boolean, isProTheme: boolean) {
  return cn(
    'shrink-0 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm transition-colors',
    isProTheme
      ? active
        ? 'bg-[#e8b4a2] text-[#1a1214]'
        : 'text-white/70 hover:bg-white/5 hover:text-white'
      : active
        ? 'bg-ink text-warm-white'
        : 'text-muted hover:bg-beige/60 hover:text-ink',
  );
}

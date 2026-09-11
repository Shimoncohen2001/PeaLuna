'use client';

import Link from 'next/link';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { useLocale } from '@/lib/i18n/locale';

export function Header() {
  const { t } = useLocale();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-ink/5 bg-warm-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-display text-2xl tracking-tight text-ink">
          {t.brand}
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex" aria-label="Main">
          <Link href="#services" className="transition-colors hover:text-ink">
            {t.nav.services}
          </Link>
          <Link href="#how-it-works" className="transition-colors hover:text-ink">
            {t.nav.howItWorks}
          </Link>
          <Link href="#trust" className="transition-colors hover:text-ink">
            {t.nav.trust}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="inline-flex h-9 items-center px-4 text-sm text-ink hover:text-champagne"
          >
            {t.nav.signIn}
          </Link>
          <Link
            href="/register"
            className="inline-flex h-9 items-center rounded-full bg-champagne px-4 text-sm font-medium text-ink shadow-soft hover:bg-champagne-light"
          >
            {t.nav.bookRepair}
          </Link>
        </div>
      </div>
    </header>
  );
}

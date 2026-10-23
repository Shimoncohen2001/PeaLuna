'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { BrandMark } from '@/components/brand/brand-mark';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { useLocale } from '@/lib/i18n/locale';

export function Header() {
  const { t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: '#services', label: t.nav.services },
    { href: '#how-it-works', label: t.nav.howItWorks },
    { href: '#trust', label: t.nav.trust },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-ink/5 bg-warm-white/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div
        dir="ltr"
        className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6"
      >
        <BrandMark href="/" priority />
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex" aria-label="Main">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden min-w-0 items-center justify-end gap-3 md:flex">
          <Link
            href="/login"
            className="inline-flex h-9 items-center px-3 text-sm text-ink hover:text-champagne"
          >
            {t.nav.signIn}
          </Link>
          <Link
            href="/register"
            className="inline-flex h-9 shrink-0 items-center rounded-full bg-champagne px-4 text-sm font-medium text-ink shadow-soft hover:bg-champagne-light"
          >
            {t.nav.bookRepair}
          </Link>
          <LanguageSwitcher />
        </div>
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <Link
            href="/register"
            className="inline-flex h-10 max-w-[9.5rem] items-center truncate rounded-full bg-champagne px-3 text-xs font-medium text-ink shadow-soft"
          >
            {t.nav.bookRepair}
          </Link>
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink"
            aria-expanded={menuOpen}
            aria-controls="marketing-mobile-menu"
            aria-label={menuOpen ? t.nav.closeMenu : t.nav.menu}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {menuOpen ? (
        <div
          id="marketing-mobile-menu"
          className="border-t border-ink/5 bg-warm-white px-4 py-4 md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Main">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-3 text-sm text-ink hover:bg-beige/60"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="rounded-lg px-3 py-3 text-sm text-ink hover:bg-beige/60"
              onClick={() => setMenuOpen(false)}
            >
              {t.nav.signIn}
            </Link>
          </nav>
          <div className="mt-4">
            <LanguageSwitcher />
          </div>
        </div>
      ) : null}
    </header>
  );
}

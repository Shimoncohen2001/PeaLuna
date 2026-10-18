'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  COOKIE_CONSENT_EVENT,
  cookiePolicyHref,
  readCookieConsent,
  writeCookieConsent,
} from '@/lib/cookies/consent';
import { useLocale } from '@/lib/i18n/locale';

export function CookieBanner() {
  const { t } = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sync = () => setVisible(!readCookieConsent());
    sync();
    window.addEventListener(COOKIE_CONSENT_EVENT, sync);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, sync);
  }, []);

  function accept() {
    writeCookieConsent();
    setVisible(false);
  }

  if (pathname === '/cookies' || !visible) return null;

  const search = searchParams.toString();
  const returnTo = search ? `${pathname}?${search}` : pathname;

  return createPortal(
    <div
      role="dialog"
      aria-label={t.cookies.title}
      className="fixed inset-x-0 bottom-0 z-[70] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-ink/10 bg-warm-white/95 p-4 shadow-elevated backdrop-blur sm:flex-row sm:items-center sm:p-5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">{t.cookies.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{t.cookies.message}</p>
          <Link
            href={cookiePolicyHref(returnTo)}
            className="mt-2 inline-block text-sm text-champagne hover:underline"
          >
            {t.cookies.learnMore}
          </Link>
        </div>
        <Button type="button" variant="gold" className="w-full shrink-0 sm:w-auto" onClick={accept}>
          {t.cookies.accept}
        </Button>
      </div>
    </div>,
    document.body,
  );
}

'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandMark } from '@/components/brand/brand-mark';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { safeReturnPath, writeCookieConsent } from '@/lib/cookies/consent';
import { useLocale } from '@/lib/i18n/locale';
import { Button } from '@/components/ui/button';

export default function CookiesPage() {
  return (
    <Suspense>
      <CookiesPolicy />
    </Suspense>
  );
}

function CookiesPolicy() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnPath(searchParams.get('next')) ?? '/';

  function accept() {
    writeCookieConsent();
    router.replace(returnTo);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blush/30 to-warm-white px-4 py-12">
      <div className="w-full max-w-lg rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-6 shadow-elevated sm:p-8">
        <div dir="ltr" className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>
        <BrandMark variant="lockup" href="/" className="mb-4 w-36 sm:w-40" />
        <h1 className="mt-2 font-display text-3xl text-ink">{t.cookies.policyTitle}</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">{t.cookies.policyIntro}</p>
        <h2 className="mt-6 text-base font-medium text-ink">{t.cookies.essentialTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t.cookies.essentialBody}</p>
        <h2 className="mt-6 text-base font-medium text-ink">{t.cookies.optionalTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t.cookies.optionalBody}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="gold"
            className="w-full sm:w-auto"
            onClick={accept}
          >
            {t.cookies.accept}
          </Button>
          <Link href={returnTo} className="inline-flex">
            <Button type="button" variant="secondary" className="w-full sm:w-auto">
              {t.common.back}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

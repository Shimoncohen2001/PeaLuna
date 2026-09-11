'use client';

import { LOCALE_LABELS, LOCALES, type Locale } from '@/lib/i18n/messages';
import { useLocale } from '@/lib/i18n/locale';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({
  className,
  variant = 'light',
}: {
  className?: string;
  variant?: 'light' | 'dark';
}) {
  const { locale, setLocale, t } = useLocale();

  return (
    <label className={cn('inline-flex items-center gap-2 text-sm', className)}>
      <span className="sr-only">{t.nav.language}</span>
      <select
        aria-label={t.nav.language}
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className={cn(
          'rounded-full border px-3 py-1.5 text-sm outline-none transition',
          variant === 'dark'
            ? 'border-white/20 bg-white/5 text-[#f7efe8]'
            : 'border-ink/10 bg-warm-white text-ink',
        )}
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_LABELS[code]}
          </option>
        ))}
      </select>
    </label>
  );
}

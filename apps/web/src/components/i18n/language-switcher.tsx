'use client';

import { LOCALE_CODES, LOCALE_LABELS, LOCALE_SWITCH_ORDER, type Locale } from '@/lib/i18n/messages';
import { useLocale } from '@/lib/i18n/locale';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({
  className,
}: {
  className?: string;
  /** Kept for existing call sites; the control is always the light FR/EN/HE bar. */
  variant?: 'light' | 'dark';
}) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      role="radiogroup"
      aria-label={t.nav.language}
      className={cn(
        'inline-flex shrink-0 rounded-full border border-ink/10 bg-warm-white p-0.5 shadow-soft',
        className,
      )}
    >
      {LOCALE_SWITCH_ORDER.map((code) => {
        const selected = locale === code;
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={LOCALE_LABELS[code]}
            onClick={() => setLocale(code)}
            className={cn(
              'min-h-8 min-w-9 rounded-full px-2.5 text-[11px] font-semibold tracking-[0.08em] transition-colors',
              selected ? 'bg-ink text-warm-white' : 'text-muted hover:text-ink',
            )}
          >
            {LOCALE_CODES[code]}
          </button>
        );
      })}
    </div>
  );
}

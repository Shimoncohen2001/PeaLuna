import type { Locale } from '@/lib/i18n/messages';

const localeMap: Record<Locale, string> = {
  en: 'en-GB',
  fr: 'fr-FR',
  he: 'he-IL',
};

export function intlLocale(locale: Locale | string): string {
  return locale in localeMap ? localeMap[locale as Locale] : typeof locale === 'string' ? locale : 'he-IL';
}

export function formatMoney(cents: number, currency = 'ILS', locale: Locale | string = 'he'): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export function formatStatus(status: string, labels?: object): string {
  if (labels && status in labels) {
    const value = (labels as Record<string, string>)[status];
    if (value) return value;
  }
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatDistanceKm(
  km: number | null | undefined,
  interpolate: (template: string, vars: Record<string, string | number>) => string,
  labels: { meters: string; km: string },
): string | null {
  if (km == null || !Number.isFinite(km)) return null;
  if (km < 1) {
    return interpolate(labels.meters, { n: Math.max(1, Math.round(km * 1000)) });
  }
  const n = km < 10 ? (Math.round(km * 10) / 10).toFixed(1) : String(Math.round(km));
  return interpolate(labels.km, { n });
}

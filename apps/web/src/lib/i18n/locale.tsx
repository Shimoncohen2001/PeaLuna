'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  dictionaries,
  interpolate,
  isLocale,
  LOCALE_STORAGE_KEY,
  type Locale,
  type Messages,
} from './messages';

type LocaleContextValue = {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  messages: Messages;
  setLocale: (locale: Locale) => void;
  t: Messages;
  format: (template: string, vars: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'he';
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (isLocale(stored)) return stored;
  const nav = window.navigator.language.toLowerCase();
  if (nav.startsWith('he') || nav.startsWith('iw')) return 'he';
  if (nav.startsWith('fr')) return 'fr';
  if (nav.startsWith('en')) return 'en';
  return 'he';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('he');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocaleState(readStoredLocale());
    setReady(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const dir = locale === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale === 'he' ? 'he' : locale;
    document.documentElement.dir = dir;
    document.documentElement.dataset.locale = locale;
  }, [locale, ready]);

  const value = useMemo<LocaleContextValue>(() => {
    const messages = dictionaries[locale];
    return {
      locale,
      dir: locale === 'he' ? 'rtl' : 'ltr',
      messages,
      setLocale,
      t: messages,
      format: interpolate,
    };
  }, [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}

'use client';
import React from 'react';
import en from '../locales/en.json';
import ru from '../locales/ru.json';

type Dict = Record<string, string>;
const DICTS: Record<string, Dict> = { en, ru } as any;

export type I18nContextType = {
  lang: 'en' | 'ru';
  setLang: (l: 'en' | 'ru') => void;
  t: (key: string, params?: Record<string, any>) => string;
};

const I18nContext = React.createContext<I18nContextType | null>(null);

function format(str: string, params?: Record<string, any>) {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => {
    const v = params[k];
    return v == null ? '' : String(v);
  });
}

function getInitialLang(fallback: 'ru' | 'en' = 'ru'): 'en' | 'ru' {
  try {
    if (typeof window !== 'undefined') {
      const fromStorage = window.localStorage.getItem('lang');
      if (fromStorage === 'ru' || fromStorage === 'en') return fromStorage;
      const nav = (
        navigator.language ||
        navigator.languages?.[0] ||
        ''
      ).toLowerCase();
      if (nav.startsWith('ru')) return 'ru';
      return 'en';
    }
  } catch {}
  return fallback;
}

export default function I18nProvider({
  children,
  initialLang = 'ru',
}: {
  children: React.ReactNode;
  initialLang?: 'en' | 'ru';
}) {
  const [lang, setLangState] = React.useState<'en' | 'ru'>(initialLang);

  React.useEffect(() => {
    const l = getInitialLang(initialLang);
    setLangState(l);
  }, [initialLang]);

  const setLang = React.useCallback((l: 'en' | 'ru') => {
    setLangState(l);
    try {
      window.localStorage.setItem('lang', l);
      document.cookie = `lang=${l}; path=/; max-age=${60 * 60 * 24 * 365}`;
    } catch {}
  }, []);

  const t = React.useCallback(
    (key: string, params?: Record<string, any>) => {
      const dict = DICTS[lang] || {};
      const str = dict[key] || key;
      return format(str, params);
    },
    [lang],
  );

  const value: I18nContextType = { lang, setLang, t };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error('I18nContext is not available');
  return ctx;
}

export function useT() {
  return useI18n().t;
}

'use client';
import React from 'react';
import I18nProvider, { useI18n, useT } from '../i18n/I18nProvider';
import Link from 'next/link';

function LangSwitcher() {
  const { lang, setLang, t } = useI18n();
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span>{t('lang.switch')}:</span>
      <button
        type="button"
        onClick={() => setLang('ru')}
        aria-pressed={lang === 'ru'}
        style={{ fontWeight: lang === 'ru' ? 700 : 400 }}
      >
        {t('lang.ru')}
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        style={{ fontWeight: lang === 'en' ? 700 : 400 }}
      >
        {t('lang.en')}
      </button>
    </div>
  );
}

function Header() {
  const t = useT();
  return (
    <header>
      <h1>{t('app.title')}</h1>
      <nav>
        <Link href="/">{t('nav.home')}</Link>
      </nav>
      <LangSwitcher />
    </header>
  );
}

function Footer() {
  const t = useT();
  const year = new Date().getFullYear();
  return (
    <footer>
      <small>{t('footer.copyright', { year })}</small>
    </footer>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <Header />
      <main>{children}</main>
      <Footer />
    </I18nProvider>
  );
}

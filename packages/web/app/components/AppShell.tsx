'use client';
import React from 'react';
import I18nProvider, { useI18n, useT } from '../i18n/I18nProvider';
import Link from 'next/link';
import { useAuth } from '../auth/AuthProvider';
import AuthProvider from '../auth/AuthProvider';
import AuthModal from './AuthModal';
import Button from './ui/button';

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
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  return (
    <header style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <h1>{t('app.title')}</h1>
        <nav>
          <Link href="/">{t('nav.home')}</Link>
        </nav>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <LangSwitcher />
        {user ? (
          <span>{user.email}</span>
        ) : (
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>{t('nav.login')}</Button>
        )}
      </div>
      <AuthModal open={open} onClose={() => setOpen(false)} />
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
      <AuthProvider>
        <Header />
        <main>{children}</main>
        <Footer />
      </AuthProvider>
    </I18nProvider>
  );
}

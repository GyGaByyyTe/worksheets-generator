'use client';
import React from 'react';
import I18nProvider, { useI18n, useT } from '../i18n/I18nProvider';
import Link from 'next/link';
import AuthProvider from '../auth/AuthProvider';
import UserBadge from './UserBadge';

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
    <header className="app-header">
      <div className="app-header__inner">
        <div className="brand-nav">
          <Link href="/" className="brand">
            {t('app.title')}
          </Link>
          <nav className="main-nav">
            <Link href="/">Главная</Link>
            <Link href="/generator">Генерация</Link>
            <Link href="/account">Аккаунт</Link>
            {/* <Link href="/mazes">Лабиринты</Link> */}
            {/* <Link href="/gallery">Галерея</Link> */}
            {/* <Link href="/my">Мои листы</Link> */}
          </nav>
        </div>
        <div className="header-actions">
          <LangSwitcher />
          <Link href="/generator" className="ui-btn btn-gradient ui-btn--sm">
            Создать
          </Link>
          <UserBadge />
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const t = useT();
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer">
      <div className="container">
        <small>{t('footer.copyright', { year })}</small>
      </div>
    </footer>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <Header />
        <main className="app-main">{children}</main>
        <Footer />
      </AuthProvider>
    </I18nProvider>
  );
}

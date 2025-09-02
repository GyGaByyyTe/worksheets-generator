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

function UserPopoverContent() {
  const { logout } = useAuth();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <button
        type="button"
        onClick={() => logout()}
        style={{
          background: 'transparent',
          border: 'none',
          textAlign: 'left',
          padding: '8px 10px',
          borderRadius: 6,
          cursor: 'pointer',
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = '#f3f4f6')
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = 'transparent')
        }
      >
        Выйти
      </button>
    </div>
  );
}

function Header() {
  const t = useT();
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
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
          {user ? (
            <div
              className="user-menu"
              style={{ position: 'relative', display: 'inline-block' }}
            >
              <span className="user-email" style={{ cursor: 'pointer' }}>
                {user.email}
              </span>
              <div
                className="user-popover"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 8,
                  minWidth: 160,
                  boxShadow: '0 8px 24px rgba(0,0,0,.12)',
                  zIndex: 100,
                }}
              >
                <UserPopoverContent />
              </div>
              <style jsx>{`
                .user-menu {
                  position: relative;
                  padding-top: 6px;
                }
                .user-email {
                  position: relative;
                  z-index: 101;
                }
                .user-popover {
                  display: none;
                  margin-top: 0;
                }
                .user-menu:hover .user-popover {
                  display: block;
                }
              `}</style>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(true)}
            >
              {t('nav.login')}
            </Button>
          )}
        </div>
      </div>
      <AuthModal open={open} onClose={() => setOpen(false)} />
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

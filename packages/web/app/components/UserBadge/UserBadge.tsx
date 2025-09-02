import Button from '../ui/button';
import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/auth/AuthProvider';
import AuthModal from '../AuthModal';
import { useT } from '@/i18n/I18nProvider';
import cl from './UserBadge.module.css';

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

export default function UserBadge() {
  const t = useT();
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);

  const deriveName = React.useCallback(() => {
    if (!user?.email) return '';
    const local = user.email.split('@')[0] || '';
    if (!local) return user.email;
    // Replace dots/underscores with space and capitalize the first letter
    const cleaned = local.replace(/[._-]+/g, ' ').trim();
    const name = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return name;
  }, [user]);

  const displayName = deriveName();
  const initial = (displayName || user?.email || '?').charAt(0).toUpperCase();

  return (
    <>
      {user ? (
        <div
          className={cl.userMenu}
          style={{ position: 'relative', display: 'inline-block' }}
        >
          <Link href="/account" className={cl.badge}>
            <div className={cl.avatar}>{initial}</div>
            <div className={cl.text}>
              <div className={cl.name}>{displayName || user.email}</div>
              <div className={cl.subtitle}>Базовый</div>
            </div>
          </Link>
          <div className={cl.userPopover}>
            <UserPopoverContent />
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          {t('nav.login')}
        </Button>
      )}
      <AuthModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

import Button from '../ui/button';
import React from 'react';
import { useAuth } from '../../auth/AuthProvider';
import AuthModal from '../AuthModal';
import { useT } from '../../i18n/I18nProvider';
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

  return (
    <>
      {user ? (
        <div
          className={cl.userMenu}
          style={{ position: 'relative', display: 'inline-block' }}
        >
          <span className={cl.userEmail} style={{ cursor: 'pointer' }}>
            {user.email}
          </span>
          <div
            className={cl.userPopover}
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

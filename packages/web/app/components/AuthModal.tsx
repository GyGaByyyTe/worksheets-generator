'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth/AuthProvider';
import { useT } from '../i18n/I18nProvider';
import Input from './ui/input';
import Button from './ui/button';

export default function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { login } = useAuth();
  const t = useT();
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setEmail('');
      setPassword('');
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) onClose();
    else setError('Invalid email or password');
  };

  if (!open) return null;

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{t('nav.login')}</h3>
        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label>
              {t('auth.email')}
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              {t('auth.password')}
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            {error && <div style={{ color: 'red', fontSize: 12 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
              <Button type="submit" disabled={loading} loading={loading}>{loading ? '...' : t('auth.login')}</Button>
              <Button type="button" variant="outline" onClick={() => { onClose(); router.push('/register'); }}>
                {t('auth.toRegister')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  background: '#fff',
  padding: 16,
  borderRadius: 8,
  minWidth: 320,
  maxWidth: '90vw',
  boxShadow: '0 8px 24px rgba(0,0,0,.2)'
};

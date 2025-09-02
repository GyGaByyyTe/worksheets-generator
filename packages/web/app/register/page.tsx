'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { absUrl } from '../lib/api';
import { useAuth } from '../auth/AuthProvider';
import { useT } from '../i18n/I18nProvider';
import Input from '../components/ui/input';
import Button from '../components/ui/button';

export default function RegisterPage() {
  const { login } = useAuth();
  const t = useT();
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(absUrl('/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data?.error || 'Registration failed');
        setLoading(false);
        return;
      }
      // Auto-login after successful registration
      const ok = await login(email, password);
      setLoading(false);
      if (ok) router.push('/');
      else router.push('/');
    } catch (e: any) {
      setError('Registration failed');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '24px auto', padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>{t('auth.register')}</h2>
      <form onSubmit={onSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label>
            {t('auth.email')}
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            {t('auth.password')}
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && (
            <div style={{ color: 'red', fontSize: 12 }}>{String(error)}</div>
          )}
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Button type="submit" disabled={loading} loading={loading}>
              {loading ? t('auth.registering') : t('auth.register_submit')}
            </Button>
            <Link href="/">{t('auth.toHome')}</Link>
          </div>
        </div>
      </form>
      <p style={{ marginTop: 16 }}>
        {t('auth.haveAccount')}{' '}
        <Link href="/" prefetch={false}>
          {t('auth.toLogin')}
        </Link>
      </p>
    </div>
  );
}

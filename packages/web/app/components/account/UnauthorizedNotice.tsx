'use client';
import React from 'react';
import Link from 'next/link';
import { useT } from '@/i18n/I18nProvider';

export default function UnauthorizedNotice() {
  const t = useT();
  return (
    <div className="card" style={{ padding: 16 }}>
      <p>{t('account.unauthorized.message')}</p>
      <Link href="/" className="ui-btn ui-btn--secondary">
        {t('auth.toHome')}
      </Link>
    </div>
  );
}

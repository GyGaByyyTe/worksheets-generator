'use client';
import React from 'react';
import { useT } from '@/i18n/I18nProvider';
import type { AccountTab } from 'lib/types';

export default function TabsNav({
  tab,
  onChange,
}: {
  tab: AccountTab;
  onChange: (tab: AccountTab) => void;
}) {
  const t = useT();
  return (
    <div className="account-tabs" role="tablist">
      <button
        className={tab === 'overview' ? 'tab tab--active' : 'tab'}
        onClick={() => onChange('overview')}
      >
        {t('account.tabs.overview')}
      </button>
      <button
        className={tab === 'generations' ? 'tab tab--active' : 'tab'}
        onClick={() => onChange('generations')}
      >
        {t('account.tabs.generations')}
      </button>
      <button
        className={tab === 'subscription' ? 'tab tab--active' : 'tab'}
        onClick={() => onChange('subscription')}
      >
        {t('account.tabs.subscription')}
      </button>
      <button
        className={tab === 'settings' ? 'tab tab--active' : 'tab'}
        onClick={() => onChange('settings')}
      >
        {t('account.tabs.settings')}
      </button>
    </div>
  );
}

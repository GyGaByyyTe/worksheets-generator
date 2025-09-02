'use client';
import React from 'react';
import { useT } from '@/i18n/I18nProvider';
import UsageProgress from './UsageProgress';
import GenGrid from '@/components/generations/GenGrid';
import type { GenItem } from '@/components/generations/GenCard';
import type { Profile, Stats } from 'lib/types';

export default function OverviewPanel({
  profile,
  stats,
  recent,
}: {
  profile: Profile;
  stats: Stats;
  recent: GenItem[];
}) {
  const t = useT();
  return (
    <div className="account-overview">
      <div
        className="grid-cards"
        style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 8 }}
      >
        <div className="card">
          <div style={{ color: '#6b7280', marginBottom: 8 }}>
            {t('account.stats.monthlyGenerations')}
          </div>
          <UsageProgress used={stats.month.used} limit={stats.month.limit} />
        </div>
        <div className="card">
          <div style={{ color: '#6b7280', marginBottom: 8 }}>
            {t('account.stats.totalDownloads')}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            {stats.downloadsTotal}
          </div>
        </div>
        <div className="card">
          <div style={{ color: '#6b7280', marginBottom: 8 }}>
            {t('account.stats.daysWithUs')}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            {stats.daysWithUs}
          </div>
        </div>
        <div className="card">
          <div style={{ color: '#6b7280', marginBottom: 8 }}>
            {t('account.stats.rating')}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.rating}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ margin: '0 0 4px 0' }}>{t('account.recent.title')}</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          {t('account.recent.subtitle')}
        </p>
        <GenGrid items={recent} />
      </div>
    </div>
  );
}

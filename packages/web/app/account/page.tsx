'use client';
import React from 'react';
import { useAuth } from '../auth/AuthProvider';
import { absUrl } from '../lib/api';
import Link from 'next/link';
import { useT } from '../i18n/I18nProvider';
import GenGrid from '../components/generations/GenGrid';
import type { GenItem as RecentItem } from '../components/generations/GenCard';

// Types
type Plan = { code: string; title: string; color?: string };
interface Profile {
  id: string;
  email: string;
  name: string;
  plan: Plan;
  avatarUrl: string | null;
  joinedAt?: string;
}
interface Stats {
  month: { used: number; limit: number };
  downloadsTotal: number;
  daysWithUs: number;
  rating: number | null;
}

function useProfileData() {
  const { token } = useAuth();
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [recent, setRecent] = React.useState<RecentItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const [p, s, r] = await Promise.all([
          fetch(absUrl('/profile'), {
            headers: { Authorization: `Bearer ${token}` },
          }).then((x) => x.json()),
          fetch(absUrl('/profile/stats'), {
            headers: { Authorization: `Bearer ${token}` },
          }).then((x) => x.json()),
          fetch(absUrl('/generations/recent?mine=1&limit=5'), {
            headers: { Authorization: `Bearer ${token}` },
          }).then((x) => x.json()),
        ]);
        if (!cancelled) {
          setProfile(p);
          setStats(s);
          setRecent(r?.items || []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return { loading, profile, stats, recent };
}

function Badge({ plan }: { plan: Plan }) {
  const bg = plan.color || '#16a34a';
  return (
    <span
      className="tag"
      style={{
        background: '#dcfce7',
        borderColor: '#bbf7d0',
        color: '#166534',
      }}
    >
      {plan.title}
    </span>
  );
}

function Progress({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>
        {used}/{limit}
      </div>
      <div style={{ height: 8, borderRadius: 999, background: '#e5e7eb' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: '#22c55e',
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}

function Overview({
  profile,
  stats,
  recent,
}: {
  profile: Profile;
  stats: Stats;
  recent: RecentItem[];
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
          <Progress used={stats.month.used} limit={stats.month.limit} />
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
          <div style={{ color: '#6b7280', marginBottom: 8 }}>{t('account.stats.daysWithUs')}</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            {stats.daysWithUs}
          </div>
        </div>
        <div className="card">
          <div style={{ color: '#6b7280', marginBottom: 8 }}>{t('account.stats.rating')}</div>
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

export default function AccountPage() {
  const { user } = useAuth();
  const { loading, profile, stats, recent } = useProfileData();
  const t = useT();

  const [tab, setTab] = React.useState<
    'overview' | 'generations' | 'subscription' | 'settings'
  >('overview');

  if (!user) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 16 }}>
          <p>{t('account.unauthorized.message')}</p>
          <Link href="/" className="ui-btn ui-btn--secondary">
            {t('auth.toHome')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div
        className="card"
        style={{ display: 'flex', gap: 16, alignItems: 'center' }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 22,
          }}
        >
          {profile?.name ? profile.name[0] : user.email[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {profile?.name || user.email}
          </div>
          <div className="muted">{user.email}</div>
          {profile?.plan && (
            <div style={{ marginTop: 6 }}>
              <Badge plan={profile.plan} />
            </div>
          )}
        </div>
        <div>
          {/* Контекстное поле переключения (плейсхолдер) */}
          <select className="ui-select">
            <option>{t('account.range.lastMonth')}</option>
            <option>{t('account.range.last3Months')}</option>
            <option>{t('account.range.lastYear')}</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12, padding: 0 }}>
        <div className="account-tabs" role="tablist">
          <button
            className={tab === 'overview' ? 'tab tab--active' : 'tab'}
            onClick={() => setTab('overview')}
          >
            {t('account.tabs.overview')}
          </button>
          <button
            className={tab === 'generations' ? 'tab tab--active' : 'tab'}
            onClick={() => setTab('generations')}
          >
            {t('account.tabs.generations')}
          </button>
          <button
            className={tab === 'subscription' ? 'tab tab--active' : 'tab'}
            onClick={() => setTab('subscription')}
          >
            {t('account.tabs.subscription')}
          </button>
          <button
            className={tab === 'settings' ? 'tab tab--active' : 'tab'}
            onClick={() => setTab('settings')}
          >
            {t('account.tabs.settings')}
          </button>
        </div>
        <div style={{ padding: 12 }}>
          {loading && <div>{t('tasks.loading')}</div>}
          {!loading && tab === 'overview' && profile && stats && (
            <Overview profile={profile} stats={stats} recent={recent} />
          )}
          {!loading && tab !== 'overview' && (
            <div className="muted">{t('account.sectionInDev', { tab: t(`account.tabs.${tab}`) })}</div>
          )}
        </div>
      </div>
    </div>
  );
}

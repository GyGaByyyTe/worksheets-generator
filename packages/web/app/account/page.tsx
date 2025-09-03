'use client';
import React from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { absUrl } from 'lib/api';
import { useT } from '@/i18n/I18nProvider';
import ProfileHeader from '@/components/account/ProfileHeader';
import TabsNav from '@/components/account/TabsNav';
import OverviewPanel from '@/components/account/OverviewPanel';
import UnauthorizedNotice from '@/components/account/UnauthorizedNotice';
import type {
  Profile,
  Stats,
  AccountTab,
  GenItem as RecentItem,
} from 'lib/types';

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

export default function AccountPage() {
  const { user } = useAuth();
  const { loading, profile, stats, recent } = useProfileData();
  const t = useT();

  const [tab, setTab] = React.useState<AccountTab>('overview');

  if (!user) {
    return (
      <div className="container">
        <UnauthorizedNotice />
      </div>
    );
  }

  return (
    <div className="container">
      <ProfileHeader profile={profile} userEmail={user.email} />

      <div className="card" style={{ marginTop: 12, padding: 0 }}>
        <TabsNav tab={tab} onChange={setTab} />
        <div style={{ padding: 12 }}>
          {loading && <div>{t('tasks.loading')}</div>}
          {!loading && tab === 'overview' && profile && stats && (
            <OverviewPanel profile={profile} stats={stats} recent={recent} />
          )}
          {!loading && tab !== 'overview' && (
            <div className="muted">
              {t('account.sectionInDev', { tab: t(`account.tabs.${tab}`) })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

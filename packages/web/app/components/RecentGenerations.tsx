'use client';
import React from 'react';
import Link from 'next/link';
import { absUrl } from 'lib/api';
import { useT } from '@/i18n/I18nProvider';

type RecentItem = {
  id: string;
  tags: string[];
  previewUrl: string;
  downloadUrl: string;
};

export default function RecentGenerations() {
  const t = useT();
  const [items, setItems] = React.useState<RecentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(absUrl('/generations/recent?limit=4'), {
          cache: 'no-store',
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
        const items: any[] = Array.isArray(json?.items) ? json.items : [];
        if (!cancelled) setItems(items as RecentItem[]);
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function locTask(slug: string): string {
    // try localized task name; fallback to raw
    const key = `task.${slug}.title`;
    const val = t(key as any);
    if (val && typeof val === 'string' && !val.startsWith('task.')) return val;
    // small mapping for known hyphenated slugs where translation keys may differ
    return slug;
  }

  function buildTitle(tags: string[]): string {
    const locs = tags.map((s) => locTask(s));
    const joined = locs.join(', ');
    const title = t('generation.title', { tasks: joined }) as string;
    return title || joined;
  }

  if (loading) {
    return (
      <section className="container section">
        <h2>Последние генерации</h2>
        <div className="muted">Загрузка…</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="container section">
        <h2>Последние генерации</h2>
        <div className="muted">{error}</div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <section id="recent" className="container section">
      <div className="section-header">
        <h2>Последние генерации</h2>
        <Link href="/gallery" className="ui-btn ui-btn--outline ui-btn--sm">
          Смотреть все
        </Link>
      </div>
      <div className="grid-cards">
        {items.map((i) => (
          <div key={i.id} className="card gen">
            <div className="gen-thumb" />
            <div className="gen-tags">
              {i.tags.slice(0, 4).map((tname) => (
                <span key={tname} className="tag">
                  {locTask(tname)}
                </span>
              ))}
            </div>
            <div className="gen-title">{buildTitle(i.tags)}</div>
            <div className="gen-actions">
              <a
                href={absUrl(i.previewUrl)}
                target="_blank"
                rel="noreferrer"
                className="ui-btn ui-btn--secondary ui-btn--sm"
              >
                {t('buttons.preview')}
              </a>
              <a
                href={absUrl(i.downloadUrl)}
                className="ui-btn ui-btn--outline ui-btn--sm"
              >
                {t('buttons.downloadPdf')}
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

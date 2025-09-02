import React from 'react';
import Link from 'next/link';
import GenGrid from './GenGrid';
import { getRecentGenerations } from 'actions/generations';

export default async function RecentSection() {
  const items = await getRecentGenerations({ limit: 4 });
  if (!items.length) return null;
  return (
    <section id="recent" className="container section">
      <div className="section-header">
        <h2>Последние генерации</h2>
        <Link href="/gallery" className="ui-btn ui-btn--outline ui-btn--sm">
          Смотреть все
        </Link>
      </div>
      <GenGrid items={items} />
    </section>
  );
}

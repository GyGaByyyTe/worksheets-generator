'use client';
import React from 'react';
import GenCard from './GenCard';
import type { GenItem } from 'lib/types';

export default function GenGrid({ items }: { items: GenItem[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="grid-cards">
      {items.map((i) => (
        <GenCard key={i.id} item={i} />
      ))}
    </div>
  );
}

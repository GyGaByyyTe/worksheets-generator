'use client';
import React from 'react';

export default function UsageProgress({
  used,
  limit,
}: {
  used: number;
  limit: number;
}) {
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

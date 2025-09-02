'use client';
import React from 'react';

export type DayConfigCardProps = {
  title: string;
  description?: string;
  status?: string;
  statusColor?: string; // e.g. '#2c7' or '#999'
  onConfigure: () => void;
  actionLabel: string;
};

export default function DayConfigCard({
  title,
  description,
  status,
  statusColor = '#999',
  onConfigure,
  actionLabel,
}: DayConfigCardProps) {
  return (
    <div className="panel" style={{ padding: 12 }}>
      <div
        className="row"
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600 }}>{title}</div>
          {(description || status) && (
            <div
              className="muted"
              style={{ marginTop: 6, color: status ? statusColor : '#777' }}
            >
              {status || description}
            </div>
          )}
        </div>
        <button
          type="button"
          className="ui-btn ui-btn--sm"
          onClick={onConfigure}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

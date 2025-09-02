'use client';
import React from 'react';
import Checkbox from '@/components/ui/checkbox';

export type TaskCardProps = {
  k: string;
  title: string;
  checked: boolean;
  logo?: string;
  onToggle: (key: string) => void;
};

export default function TaskCard({
  k,
  title,
  checked,
  logo,
  onToggle,
}: TaskCardProps) {
  return (
    <div
      className="card"
      style={{ cursor: 'pointer' }}
      onClick={() => onToggle(k)}
    >
      <label
        // className="chk"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          name="tasks"
          value={k}
          checked={checked}
          onChange={() => onToggle(k)}
        />
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt={title}
            width={24}
            height={24}
            style={{
              borderRadius: 4,
              objectFit: 'contain',
              background: '#fff',
            }}
          />
        )}
        <span style={{ fontWeight: 600 }}>{title}</span>
      </label>
    </div>
  );
}

'use client';
import React from 'react';
import { useT } from '../i18n/I18nProvider';

export type DaysSelectorProps = {
  days: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
};

export default function DaysSelector({
  days,
  onChange,
  min = 1,
  max = 7,
}: DaysSelectorProps) {
  const t = useT();
  return (
    <div className="row">
      <label>{t('days.label')}</label>
      <input
        name="days"
        type="number"
        min={min}
        max={max}
        value={days}
        onChange={(e) => onChange(Number(e.target.value || min))}
      />
    </div>
  );
}

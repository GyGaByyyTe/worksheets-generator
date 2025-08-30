'use client';
import React from 'react';
import ImageDotsTable, { ImageDotsParams } from './ImageDotsTable';
import { useT } from '../i18n/I18nProvider';
import Checkbox from './ui/checkbox';

export type ConnectDotsPanelProps = {
  days: number;
  lockToDays: boolean;
  setLockToDays: (v: boolean) => void;
  dotsRows: ImageDotsParams[];
  setDotsRows: (rows: ImageDotsParams[]) => void;
};

export default function ConnectDotsPanel({
  days,
  lockToDays,
  setLockToDays,
  dotsRows,
  setDotsRows,
}: ConnectDotsPanelProps) {
  const t = useT();
  return (
    <div className="row" style={{ width: '100%' }}>
      <div style={{ width: '100%' }}>
        <div className="panel">
          <div className="row">
            <label className="chk">
              <Checkbox
                checked={lockToDays}
                onChange={(e) => setLockToDays((e.target as HTMLInputElement).checked)}
              />{' '}
              {t('connectDots.lockLabel')}
            </label>
            {lockToDays && (
              <div style={{ color: '#555' }}>
                {t('connectDots.picturesCount', { days })}
              </div>
            )}
          </div>
          <ImageDotsTable
            rows={dotsRows}
            setRows={setDotsRows}
            lockedCount={lockToDays ? days : null}
          />
        </div>
      </div>
    </div>
  );
}

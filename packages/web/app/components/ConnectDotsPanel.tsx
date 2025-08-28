'use client';
import React from 'react';
import ImageDotsTable, { ImageDotsParams } from './ImageDotsTable';

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
  return (
    <div className="row" style={{ width: '100%' }}>
      <div style={{ width: '100%' }}>
        <div className="panel">
          <div className="row">
            <label className="chk">
              <input
                type="checkbox"
                checked={lockToDays}
                onChange={(e) => setLockToDays(e.target.checked)}
              />{' '}
              Привязать число картинок к числу дней
            </label>
            {lockToDays && (
              <div style={{ color: '#555' }}>Картинок: {days}</div>
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

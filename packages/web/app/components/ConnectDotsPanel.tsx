'use client';
import React from 'react';
import ImageDotsTable, { ImageDotsParams, defaultParams } from './ImageDotsTable';
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
  const [openDay, setOpenDay] = React.useState<number | null>(null);

  // Ensure rows length matches days when locked
  React.useEffect(() => {
    if (!lockToDays) return;
    if (days < 1) return;
    const next = dotsRows.slice();
    while (next.length < days) next.push(defaultParams());
    if (next.length > days) next.length = days;
    if (next.length !== dotsRows.length) setDotsRows(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, lockToDays]);

  const dayCards = Array.from({ length: days }, (_, i) => i);

  return (
    <div className="row" style={{ width: '100%' }}>
      <div style={{ width: '100%' }}>
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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

          {/* Day cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
            {dayCards.map((i) => {
              const r = dotsRows[i];
              const configured = !!(r?.file || r?.imageUrl);
              return (
                <div key={i} className="panel" style={{ padding: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>{t('connectDots.day.title', { n: i + 1 })}</div>
                  <div className="muted" style={{ marginBottom: 8, color: configured ? '#2c7' : '#999' }}>
                    {configured ? t('connectDots.day.configured') : t('connectDots.day.notConfigured')}
                  </div>
                  <button type="button" className="ui-btn ui-btn--sm" onClick={() => setOpenDay(i)}>
                    {t('connectDots.day.configure')}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Hidden inputs table to submit all days */}
          <div style={{ display: 'none' }}>
            <ImageDotsTable rows={dotsRows} setRows={setDotsRows} lockedCount={lockToDays ? days : null} baseIndex={0} />
          </div>
        </div>
      </div>

      {/* Modal */}
      {openDay != null && (
        <div style={backdropStyle} onClick={() => setOpenDay(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{t('connectDots.modal.title', { n: (openDay as number) + 1 })}</h3>
            <ImageDotsTable
              rows={[dotsRows[openDay] || defaultParams()]}
              setRows={(rows) => {
                const next = dotsRows.slice();
                next[openDay!] = rows[0];
                setDotsRows(next);
              }}
              lockedCount={1}
              baseIndex={openDay || 0}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="ui-btn ui-btn--outline" onClick={() => setOpenDay(null)}>
                {t('buttons.close') || t('buttons.cancel') || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  background: '#fff',
  padding: 16,
  borderRadius: 8,
  minWidth: 360,
  maxWidth: '90vw',
  boxShadow: '0 8px 24px rgba(0,0,0,.2)'
};

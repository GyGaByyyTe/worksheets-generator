'use client';
import React from 'react';
import ImageDotsTable, { defaultParams } from '@/components/ImageDotsTable';
import { useT } from '@/i18n/I18nProvider';
import Checkbox from '@/components/ui/checkbox';
import DayConfigCard from '@/components/DayConfigCard';
import DotsConfigForm from '@/components/DotsConfigForm';
import type { ImageDotsParams } from 'lib/types';

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
  }, [days, lockToDays]);

  const dayCards = Array.from({ length: days }, (_, i) => i);

  return (
    <div className="row" style={{ width: '100%' }}>
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="muted">{t('connectDots.section.description')}</div>
          </div>

          {/* <div className="row">
            <label className="chk">
              <Checkbox
                checked={lockToDays}
                onChange={(e) =>
                  setLockToDays((e.target as HTMLInputElement).checked)
                }
              />{' '}
              {t('connectDots.lockLabel')}
            </label>
            {lockToDays && (
              <div style={{ color: '#555' }}>
                {t('connectDots.picturesCount', { days })}
              </div>
            )}
          </div> */}

          {/* Day cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {dayCards.map((i) => {
              const r = dotsRows[i];
              const configured = !!(r?.file || r?.imageUrl);
              const title = t('connectDots.day.title', { n: i + 1 });
              let status = t('connectDots.day.status.randomPending');
              if (r?.file) status = t('connectDots.day.status.uploadSelected');
              else if (r?.imageUrl)
                status = t('connectDots.day.status.randomSelected', {
                  category: r?.category || '',
                  subcategory: r?.subcategory || '',
                });
              return (
                <DayConfigCard
                  key={i}
                  title={title}
                  status={status}
                  statusColor={configured ? '#2c7' : '#999'}
                  onConfigure={() => setOpenDay(i)}
                  actionLabel={t('connectDots.day.configure')}
                />
              );
            })}
          </div>

          {/* Hidden inputs table to submit all days */}
          <div style={{ display: 'none' }}>
            {/* Persistent hidden file inputs (must stay mounted for form submit) */}
            {Array.from(
              { length: lockToDays ? days : dotsRows.length },
              (_, i) => (
                <input
                  key={i}
                  type="file"
                  id={`imageDots_${i}_file`}
                  name={`imageDots[${i}][file]`}
                  accept="image/*"
                  onChange={(e) => {
                    const file =
                      (e.target as HTMLInputElement).files?.[0] || null;
                    const next = dotsRows.slice();
                    const prev = next[i] || defaultParams();
                    next[i] = {
                      ...prev,
                      file,
                      source: file ? 'upload' : prev.source,
                      imageUrl: file ? '' : prev.imageUrl,
                      previewUrl: file ? '' : prev.previewUrl,
                    };
                    setDotsRows(next);
                  }}
                />
              ),
            )}
            <ImageDotsTable
              rows={dotsRows}
              setRows={setDotsRows}
              lockedCount={lockToDays ? days : null}
              baseIndex={0}
              renderFileInput={false}
            />
          </div>
        </div>
      </div>

      {/* Modal */}
      {openDay != null && (
        <div style={backdropStyle} onClick={() => setOpenDay(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>
              {t('connectDots.modal.title', { n: (openDay as number) + 1 })}
            </h3>
            <DotsConfigForm
              value={dotsRows[openDay] || defaultParams()}
              onChange={(val) => {
                const next = dotsRows.slice();
                next[openDay!] = val;
                setDotsRows(next);
              }}
              fileInputName={`imageDots[${openDay}][file]`}
              fileInputId={`imageDots_${openDay}_file`}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                marginTop: 12,
              }}
            >
              <button
                type="button"
                className="ui-btn ui-btn--outline"
                onClick={() => setOpenDay(null)}
              >
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
  boxShadow: '0 8px 24px rgba(0,0,0,.2)',
};

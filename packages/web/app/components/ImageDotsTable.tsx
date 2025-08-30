'use client';
import React from 'react';
import { useT } from '../i18n/I18nProvider';
import Select from './ui/select';
import Checkbox from './ui/checkbox';
import Button from './ui/button';
import Input from './ui/input';

export type NumberingMode = 'continuous' | 'per-contour';
export type PointsDistribution = 'proportional' | 'equal';

export type ImageDotsParams = {
  file?: File | null;
  // core params
  pointsCount: number;
  simplifyTolerance: number;
  threshold: number;
  multiContours: boolean;
  maxContours: number;
  decorAreaRatio: number; // 0..0.9
  numbering: NumberingMode;
  pointsDistribution: PointsDistribution;
  blurSigma: number;
  targetContours?: string; // comma-separated indices; UI-friendly; optional
};

export type ImageDotsTableProps = {
  rows: ImageDotsParams[];
  setRows: (rows: ImageDotsParams[]) => void;
  lockedCount?: number | null; // when provided, force rows.length === lockedCount
};

export function defaultParams(): ImageDotsParams {
  return {
    file: null,
    pointsCount: 50,
    simplifyTolerance: 1.2,
    threshold: 180,
    multiContours: false,
    maxContours: 6,
    decorAreaRatio: 0.18,
    numbering: 'continuous',
    pointsDistribution: 'proportional',
    blurSigma: 1.4,
    targetContours: '',
  };
}

export default function ImageDotsTable({
  rows,
  setRows,
  lockedCount = null,
}: ImageDotsTableProps) {
  const t = useT();
  // Ensure row count matches lockedCount if provided
  React.useEffect(() => {
    if (lockedCount == null) return;
    if (lockedCount < 0) return;
    if (rows.length === lockedCount) return;
    if (rows.length < lockedCount) {
      const add = Array.from({ length: lockedCount - rows.length }, () =>
        defaultParams(),
      );
      setRows([...rows, ...add]);
    } else {
      setRows(rows.slice(0, lockedCount));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedCount]);

  const update = (idx: number, patch: Partial<ImageDotsParams>) => {
    const next = rows.slice();
    next[idx] = { ...next[idx], ...patch };
    setRows(next);
  };

  const addRow = () => setRows([...rows, defaultParams()]);
  const removeRow = (idx: number) => {
    const next = rows.slice();
    next.splice(idx, 1);
    setRows(next);
  };

  return (
    <div className="panel" style={{ marginTop: 8 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div style={{ fontWeight: 600 }}>{t('imageDots.title')}</div>
        {lockedCount == null && (
          <div>
            <Button type="button" onClick={addRow} style={{ marginRight: 6 }}>
              {t('imageDots.add')}
            </Button>
          </div>
        )}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>{t('table.#')}</th>
              <th style={th}>{t('table.image')}</th>
              <th style={th}>{t('table.points')}</th>
              <th style={th}>{t('table.simplify')}</th>
              <th style={th}>{t('table.threshold')}</th>
              <th style={th}>{t('table.multiContours')}</th>
              <th style={th}>{t('table.maxContours')}</th>
              <th style={th}>{t('table.decorRatio')}</th>
              <th style={th}>{t('table.numbering')}</th>
              <th style={th}>{t('table.distribution')}</th>
              <th style={th}>{t('table.blur')}</th>
              <th style={th}>{t('table.targetContours')}</th>
              {lockedCount == null && <th style={th}>{t('table.actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={tdCenter}>{i + 1}</td>
                <td style={td}>
                  <Input
                    name={`imageDots[${i}][file]`}
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      update(i, { file: (e.target as HTMLInputElement).files?.[0] || null })
                    }
                  />
                </td>
                <td style={tdNarrow}>
                  <Input
                    name={`imageDots[${i}][pointsCount]`}
                    type="number"
                    min={5}
                    max={1000}
                    value={r.pointsCount}
                    onChange={(e) =>
                      update(i, {
                        pointsCount: clampInt((e.target as HTMLInputElement).value, 5, 1000),
                      })
                    }
                  />
                </td>
                <td style={tdNarrow}>
                  <Input
                    name={`imageDots[${i}][simplifyTolerance]`}
                    type="number"
                    step={0.1}
                    min={0.1}
                    max={10}
                    value={r.simplifyTolerance}
                    onChange={(e) =>
                      update(i, {
                        simplifyTolerance: clampFloat((e.target as HTMLInputElement).value, 0.1, 10),
                      })
                    }
                  />
                </td>
                <td style={tdNarrow}>
                  <Input
                    name={`imageDots[${i}][threshold]`}
                    type="number"
                    min={0}
                    max={255}
                    value={r.threshold}
                    onChange={(e) =>
                      update(i, { threshold: clampInt((e.target as HTMLInputElement).value, 0, 255) })
                    }
                  />
                </td>
                <td style={tdCenter}>
                  <Checkbox
                    name={`imageDots[${i}][multiContours]`}
                    checked={r.multiContours}
                    onChange={(e) =>
                      update(i, { multiContours: (e.target as HTMLInputElement).checked })
                    }
                  />
                </td>
                <td style={tdNarrow}>
                  <Input
                    name={`imageDots[${i}][maxContours]`}
                    type="number"
                    min={1}
                    max={20}
                    value={r.maxContours}
                    onChange={(e) =>
                      update(i, {
                        maxContours: clampInt((e.target as HTMLInputElement).value, 1, 20),
                      })
                    }
                  />
                </td>
                <td style={tdNarrow}>
                  <Input
                    name={`imageDots[${i}][decorAreaRatio]`}
                    type="number"
                    step={0.01}
                    min={0}
                    max={0.9}
                    value={r.decorAreaRatio}
                    onChange={(e) =>
                      update(i, {
                        decorAreaRatio: clampFloat((e.target as HTMLInputElement).value, 0, 0.9),
                      })
                    }
                  />
                </td>
                <td style={td}>
                  <Select
                    name={`imageDots[${i}][numbering]`}
                    value={r.numbering}
                    onChange={(e) =>
                      update(i, { numbering: (e.target as HTMLSelectElement).value as NumberingMode })
                    }
                  >
                    <option value="continuous">
                      {t('numbering.continuous')}
                    </option>
                    <option value="per-contour">
                      {t('numbering.perContour')}
                    </option>
                  </Select>
                </td>
                <td style={td}>
                  <Select
                    name={`imageDots[${i}][pointsDistribution]`}
                    value={r.pointsDistribution}
                    onChange={(e) =>
                      update(i, {
                        pointsDistribution: (e.target as HTMLSelectElement).value as PointsDistribution,
                      })
                    }
                  >
                    <option value="proportional">
                      {t('distribution.proportional')}
                    </option>
                    <option value="equal">{t('distribution.equal')}</option>
                  </Select>
                </td>
                <td style={tdNarrow}>
                  <Input
                    name={`imageDots[${i}][blurSigma]`}
                    type="number"
                    step={0.1}
                    min={0}
                    max={10}
                    value={r.blurSigma}
                    onChange={(e) =>
                      update(i, {
                        blurSigma: clampFloat((e.target as HTMLInputElement).value, 0, 10),
                      })
                    }
                  />
                </td>
                <td style={td}>
                  <Input
                    name={`imageDots[${i}][targetContours]`}
                    type="text"
                    placeholder={t('imageDots.placeholder')}
                    value={r.targetContours || ''}
                    onChange={(e) =>
                      update(i, { targetContours: (e.target as HTMLInputElement).value })
                    }
                  />
                </td>
                {lockedCount == null && (
                  <td style={tdCenter}>
                    <Button type="button" onClick={() => removeRow(i)}>
                      {t('buttons.remove')}
                    </Button>
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td style={td} colSpan={lockedCount == null ? 13 : 12}>
                  {t('imageDots.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 8, color: '#555' }}>{t('imageDots.hint')}</div>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '6px 8px',
  borderBottom: '1px solid #ddd',
  fontWeight: 600,
  fontSize: 12,
};
const td: React.CSSProperties = {
  padding: '6px 8px',
  borderBottom: '1px solid #eee',
};
const tdCenter: React.CSSProperties = { ...td, textAlign: 'center' };
const tdNarrow: React.CSSProperties = { ...td, width: 110 };

function clampInt(v: string, min: number, max: number): number {
  const n = Math.floor(Number(v || 0));
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}
function clampFloat(v: string, min: number, max: number): number {
  const n = Number(v || 0);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

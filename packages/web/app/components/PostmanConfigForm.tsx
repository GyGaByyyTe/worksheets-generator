'use client';
import * as React from 'react';
import Select from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useT } from '@/i18n/I18nProvider';

export type PostmanConfig = {
  difficulty: number; // 1..3 (1=easy,2=medium,3=hard)
  lettersMin: number;
  lettersMax: number;
  missingMin: number;
  missingMax: number;
};

const LIMITS: Record<
  number,
  { letters: [number, number]; missing: [number, number] }
> = {
  1: { letters: [1, 3], missing: [1, 4] },
  2: { letters: [2, 4], missing: [2, 4] },
  3: { letters: [1, 6], missing: [1, 5] },
};

export default function PostmanConfigForm({
  value,
  onChange,
}: {
  value: PostmanConfig;
  onChange: (next: PostmanConfig) => void;
}) {
  const t = useT();
  const { difficulty, lettersMin, lettersMax, missingMin, missingMax } = value;

  const limits = LIMITS[difficulty] || LIMITS[3];
  const [L_lo, L_hi] = limits.letters;
  const [H_lo, H_hi] = limits.missing;

  React.useEffect(() => {
    // When difficulty changes, clamp ranges into allowed limits
    onChange({
      difficulty,
      lettersMin: Math.max(L_lo, Math.min(L_hi, lettersMin)),
      lettersMax: Math.max(
        L_lo,
        Math.min(L_hi, Math.max(lettersMin, lettersMax)),
      ),
      missingMin: Math.max(H_lo, Math.min(H_hi, missingMin)),
      missingMax: Math.max(
        H_lo,
        Math.min(H_hi, Math.max(missingMin, missingMax)),
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minWidth: 360,
      }}
    >
      {/* Difficulty */}
      <label className="ui-field">
        <div className="ui-field__label">{t('postman.form.difficulty')}</div>
        <Select
          value={String(difficulty)}
          onChange={(e) =>
            onChange({
              ...value,
              difficulty: Number((e.target as HTMLSelectElement).value),
            })
          }
        >
          <option value="1">{t('postman.difficulty.1')}</option>
          <option value="2">{t('postman.difficulty.2')}</option>
          <option value="3">{t('postman.difficulty.3')}</option>
        </Select>
      </label>

      {/* Letters range */}
      <Slider
        min={L_lo}
        max={L_hi}
        step={1}
        value={lettersMin}
        onChange={(e) => {
          const nextMin = Number((e.target as HTMLInputElement).value);
          onChange({ ...value, lettersMin: Math.min(nextMin, lettersMax) });
        }}
        label={t('postman.form.lettersMin')}
        valueLabel={lettersMin}
      />
      <Slider
        min={L_lo}
        max={L_hi}
        step={1}
        value={lettersMax}
        onChange={(e) => {
          const nextMax = Number((e.target as HTMLInputElement).value);
          onChange({ ...value, lettersMax: Math.max(nextMax, lettersMin) });
        }}
        label={t('postman.form.lettersMax')}
        valueLabel={lettersMax}
      />

      {/* Missing houses range */}
      <Slider
        min={H_lo}
        max={H_hi}
        step={1}
        value={missingMin}
        onChange={(e) => {
          const nextMin = Number((e.target as HTMLInputElement).value);
          onChange({ ...value, missingMin: Math.min(nextMin, missingMax) });
        }}
        label={t('postman.form.missingMin')}
        valueLabel={missingMin}
      />
      <Slider
        min={H_lo}
        max={H_hi}
        step={1}
        value={missingMax}
        onChange={(e) => {
          const nextMax = Number((e.target as HTMLInputElement).value);
          onChange({ ...value, missingMax: Math.max(nextMax, missingMin) });
        }}
        label={t('postman.form.missingMax')}
        valueLabel={missingMax}
      />
    </div>
  );
}

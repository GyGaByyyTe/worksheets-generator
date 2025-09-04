'use client';
import * as React from 'react';
import Select from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import Switch from '@/components/ui/switch';
import { useT } from '@/i18n/I18nProvider';

export type WeightsConfig = {
  difficulty: number; // 1..3
  taskType: 'regular' | 'classic' | 'multiple' | 'inequalities' | 'sequences';
  count: number; // tasks per page (recommended up to 10)
  useIcons: boolean;
};

export default function WeightsConfigForm({
  value,
  onChange,
}: {
  value: WeightsConfig;
  onChange: (next: WeightsConfig) => void;
}) {
  const t = useT();
  const update = (patch: Partial<WeightsConfig>) => onChange({ ...value, ...patch });
  const { difficulty, taskType, count, useIcons } = value;

  React.useEffect(() => {
    // Clamp values if needed in the future
    if (count < 1) update({ count: 1 });
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
        <div className="ui-field__label">{t('weights.form.difficulty')}</div>
        <Select
          value={String(difficulty)}
          onChange={(e) =>
            update({ difficulty: Number((e.target as HTMLSelectElement).value) })
          }
        >
          <option value="1">{t('weights.difficulty.1')}</option>
          <option value="2">{t('weights.difficulty.2')}</option>
          <option value="3">{t('weights.difficulty.3')}</option>
        </Select>
      </label>

      {/* Task type */}
      <label className="ui-field">
        <div className="ui-field__label">{t('weights.form.type')}</div>
        <Select
          value={taskType}
          onChange={(e) => update({ taskType: (e.target as HTMLSelectElement).value as WeightsConfig['taskType'] })}
        >
          <option value="regular">{t('weights.type.regular')}</option>
          <option value="classic">{t('weights.type.classic')}</option>
          <option value="multiple">{t('weights.type.multiple')}</option>
          <option value="inequalities">{t('weights.type.inequalities')}</option>
          <option value="sequences">{t('weights.type.sequences')}</option>
        </Select>
      </label>

      {/* Count */}
      <Slider
        min={1}
        max={taskType === 'classic' ? 10 : 6}
        step={1}
        value={count}
        onChange={(e) => update({ count: Number((e.target as HTMLInputElement).value) })}
        label={t('weights.form.count')}
        valueLabel={count}
      />

      {/* Icons toggle */}
      <Switch
        checked={useIcons}
        onChange={(e) => update({ useIcons: (e.target as HTMLInputElement).checked })}
        label={t('weights.form.useIcons')}
      />
    </div>
  );
}

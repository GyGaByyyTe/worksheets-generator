'use client';
import * as React from 'react';
import Select from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import Switch from '@/components/ui/switch';
import { useT } from '@/i18n/I18nProvider';

export type AdditionConfig = {
  difficulty: number; // 1..6
  count: number; // tasks per page (max 15)
  useIcons: boolean;
  iconTheme?: 'fruits' | 'hearts' | 'animals' | 'shapes' | '';
};

export default function AdditionConfigForm({
  value,
  onChange,
}: {
  value: AdditionConfig;
  onChange: (next: AdditionConfig) => void;
}) {
  const t = useT();
  const update = (patch: Partial<AdditionConfig>) =>
    onChange({ ...value, ...patch });
  const { difficulty, count, useIcons, iconTheme } = value;

  React.useEffect(() => {
    // Icons are available only for level 1
    if (difficulty !== 1) update({ useIcons: false });
    // Clamp count to 4 for difficulty 1
    if (difficulty === 1 && count > 4) update({ count: 4 });
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
        <div className="ui-field__label">{t('addition.form.difficulty')}</div>
        <Select
          value={String(difficulty)}
          onChange={(e) =>
            update({
              difficulty: Number((e.target as HTMLSelectElement).value),
            })
          }
        >
          <option value="1">{t('addition.difficulty.1')}</option>
          <option value="2">{t('addition.difficulty.2')}</option>
          <option value="3">{t('addition.difficulty.3')}</option>
          <option value="4">{t('addition.difficulty.4')}</option>
          <option value="5">{t('addition.difficulty.5')}</option>
          <option value="6">{t('addition.difficulty.6')}</option>
        </Select>
      </label>

      {/* Count */}
      <Slider
        min={1}
        max={difficulty === 1 ? 4 : 15}
        step={1}
        value={count}
        onChange={(e) =>
          update({ count: Number((e.target as HTMLInputElement).value) })
        }
        label={t('addition.form.count')}
        valueLabel={count}
      />

      {/* Icons toggle (only for difficulty 1) */}
      {difficulty === 1 && (
        <Switch
          checked={useIcons}
          onChange={(e) =>
            update({ useIcons: (e.target as HTMLInputElement).checked })
          }
          label={t('addition.form.useIcons')}
        />
      )}

      {/* Icon theme */}
      {difficulty === 1 && useIcons && (
        <label className="ui-field">
          <div className="ui-field__label">{t('addition.form.iconTheme')}</div>
          <Select
            value={iconTheme || 'fruits'}
            onChange={(e) =>
              update({
                iconTheme: (e.target as HTMLSelectElement)
                  .value as AdditionConfig['iconTheme'],
              })
            }
          >
            <option value="fruits">{t('addition.theme.fruits')}</option>
            <option value="hearts">{t('addition.theme.hearts')}</option>
            <option value="animals">{t('addition.theme.animals')}</option>
            <option value="shapes">{t('addition.theme.shapes')}</option>
          </Select>
        </label>
      )}
    </div>
  );
}

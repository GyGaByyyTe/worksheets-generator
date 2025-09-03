'use client';
import React, { useEffect } from 'react';
import Checkbox from '@/components/ui/checkbox';

export type AdditionPanelProps = {
  defaultDifficulty?: number; // 1..6
  defaultUseIcons?: boolean;
};

export default function AdditionPanel({
  defaultDifficulty = 3,
  defaultUseIcons = false,
}: AdditionPanelProps) {
  const [difficulty, setDifficulty] = React.useState<number>(defaultDifficulty);
  const [useIcons, setUseIcons] = React.useState<boolean>(defaultUseIcons);

  useEffect(() => {
    if (difficulty !== 1) {
      setUseIcons(false);
    }
  }, [difficulty]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="muted">
          Выберите уровень сложности и включите иконки для примеров в пределах
          10.
        </div>
      </div>

      <div className="row" style={{ alignItems: 'center', gap: 12 }}>
        <label style={{ minWidth: 180, fontWeight: 600 }}>Сложность</label>
        <select
          name="taskOptions[addition][difficulty]"
          className="ui-input"
          value={String(difficulty)}
          onChange={(e) => setDifficulty(Number(e.target.value))}
        >
          <option value="1">1 — до 10</option>
          <option value="2">2 — до 20</option>
          <option value="3">3 — до 100 без переноса</option>
          <option value="4">4 — до 100 с переносом</option>
          <option value="5">5 — до 1000 без переноса</option>
          <option value="6">6 — до 1000 с переносом</option>
        </select>
      </div>

      {difficulty === 1 && (
        <label className="chk">
          <Checkbox
            checked={useIcons}
            onChange={(e) =>
              setUseIcons((e.target as HTMLInputElement).checked)
            }
          />
          Использовать иконки вместо цифр
        </label>
      )}

      {/* Hidden input mirrors checkbox boolean as string for server */}
      <input
        type="hidden"
        name="taskOptions[addition][useIcons]"
        value={useIcons ? 'true' : 'false'}
      />
    </div>
  );
}

'use client';
import React from 'react';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import AdditionConfigForm, {
  type AdditionConfig,
} from '@/components/AdditionConfigForm';
import { useT } from '@/i18n/I18nProvider';

export type AdditionPanelProps = {
  defaultDifficulty?: number; // 1..6
  defaultUseIcons?: boolean;
  defaultCount?: number; // 1..15
  open?: boolean; // controls modal visibility (from parent)
  onClose?: () => void;
};

export default function AdditionPanel({
  defaultDifficulty = 3,
  defaultUseIcons = false,
  defaultCount = 10,
  open = false,
  onClose,
}: AdditionPanelProps) {
  const t = useT();
  const [cfg, setCfg] = React.useState<AdditionConfig>({
    difficulty: defaultDifficulty,
    useIcons: defaultUseIcons,
    count: defaultCount,
    iconTheme: 'fruits',
  });

  React.useEffect(() => {
    // Ensure icons allowed only on level 1
    if (cfg.difficulty !== 1 && cfg.useIcons) {
      setCfg((prev) => ({ ...prev, useIcons: false }));
    }
  }, [cfg.difficulty]);

  const difficultyLabel = (d: number) => {
    switch (d) {
      case 1:
        return t('addition.difficulty.1');
      case 2:
        return t('addition.difficulty.2');
      case 3:
        return t('addition.difficulty.3');
      case 4:
        return t('addition.difficulty.4');
      case 5:
        return t('addition.difficulty.5');
      case 6:
        return t('addition.difficulty.6');
      default:
        return t('task.addition.title');
    }
  };

  const themeLabel = (v?: AdditionConfig['iconTheme']) => {
    switch (v) {
      case 'fruits':
        return t('addition.theme.fruits');
      case 'hearts':
        return t('addition.theme.hearts');
      case 'animals':
        return t('addition.theme.animals');
      case 'shapes':
        return t('addition.theme.shapes');
      default:
        return '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Hidden inputs to submit the current config */}
      <input
        type="hidden"
        name="taskOptions[addition][difficulty]"
        value={String(cfg.difficulty)}
      />
      <input
        type="hidden"
        name="taskOptions[addition][count]"
        value={String(cfg.count)}
      />
      <input
        type="hidden"
        name="taskOptions[addition][useIcons]"
        value={cfg.useIcons ? 'true' : 'false'}
      />
      <input
        type="hidden"
        name="taskOptions[addition][iconTheme]"
        value={cfg.iconTheme || ''}
      />

      {/* Summary of selected preferences */}
      <div className="gen-tags" style={{ flexWrap: 'wrap' }}>
        <span className="tag">
          {t('addition.summary.difficulty')}: {difficultyLabel(cfg.difficulty)}
        </span>
        <span className="tag">
          {t('addition.summary.count')}: {cfg.count}
        </span>

        {cfg.useIcons && (
          <span className="tag">
            {t('addition.summary.icons')}: {themeLabel(cfg.iconTheme)}
          </span>
        )}
      </div>

      <Modal
        open={open}
        onClose={onClose || (() => {})}
        title={t('addition.modal.title')}
      >
        <AdditionConfigForm value={cfg} onChange={setCfg} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 12,
          }}
        >
          <Button type="button" variant="outline" onClick={onClose}>
            {t('buttons.cancel')}
          </Button>
          <Button type="button" onClick={onClose}>
            {t('buttons.apply')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

'use client';
import React from 'react';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import SubtractionConfigForm, {
  type SubtractionConfig,
} from '@/components/SubtractionConfigForm';
import { useT } from '@/i18n/I18nProvider';

export type SubtractionPanelProps = {
  defaultDifficulty?: number; // 1..6
  defaultUseIcons?: boolean;
  defaultCount?: number; // 1..15
  open?: boolean; // controls modal visibility (from parent)
  onClose?: () => void;
};

export default function SubtractionPanel({
  defaultDifficulty = 3,
  defaultUseIcons = false,
  defaultCount = 10,
  open = false,
  onClose,
}: SubtractionPanelProps) {
  const t = useT();
  const [cfg, setCfg] = React.useState<SubtractionConfig>({
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
        return t('subtraction.difficulty.1');
      case 2:
        return t('subtraction.difficulty.2');
      case 3:
        return t('subtraction.difficulty.3');
      case 4:
        return t('subtraction.difficulty.4');
      case 5:
        return t('subtraction.difficulty.5');
      case 6:
        return t('subtraction.difficulty.6');
      default:
        return t('task.subtraction.title');
    }
  };

  const themeLabel = (v?: SubtractionConfig['iconTheme']) => {
    switch (v) {
      case 'fruits':
        return t('subtraction.theme.fruits');
      case 'hearts':
        return t('subtraction.theme.hearts');
      case 'animals':
        return t('subtraction.theme.animals');
      case 'shapes':
        return t('subtraction.theme.shapes');
      default:
        return '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Hidden inputs to submit the current config */}
      <input
        type="hidden"
        name="taskOptions[subtraction][difficulty]"
        value={String(cfg.difficulty)}
      />
      <input
        type="hidden"
        name="taskOptions[subtraction][count]"
        value={String(cfg.count)}
      />
      <input
        type="hidden"
        name="taskOptions[subtraction][useIcons]"
        value={cfg.useIcons ? 'true' : 'false'}
      />
      <input
        type="hidden"
        name="taskOptions[subtraction][iconTheme]"
        value={cfg.iconTheme || ''}
      />

      {/* Summary of selected preferences */}
      <div className="gen-tags" style={{ flexWrap: 'wrap' }}>
        <span className="tag">{difficultyLabel(cfg.difficulty)}</span>
        <span className="tag">
          {t('subtraction.summary.count')}: {cfg.count}
        </span>

        {cfg.useIcons && (
          <span className="tag">
            {t('subtraction.summary.icons')}: {themeLabel(cfg.iconTheme)}
          </span>
        )}
      </div>

      <Modal
        open={open}
        onClose={onClose || (() => {})}
        title={t('subtraction.modal.title')}
      >
        <SubtractionConfigForm value={cfg} onChange={setCfg} />
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

'use client';
import React from 'react';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import WeightsConfigForm, { type WeightsConfig } from '@/components/WeightsConfigForm';
import { useT } from '@/i18n/I18nProvider';

export type WeightsPanelProps = {
  defaultDifficulty?: number; // 1..3
  defaultTaskType?: WeightsConfig['taskType'];
  defaultUseIcons?: boolean;
  defaultCount?: number; // 1..15
  open?: boolean; // controls modal visibility (from parent)
  onClose?: () => void;
};

export default function WeightsPanel({
  defaultDifficulty = 2,
  defaultTaskType = 'regular',
  defaultUseIcons = false,
  defaultCount = 6,
  open = false,
  onClose,
}: WeightsPanelProps) {
  const t = useT();
  const [cfg, setCfg] = React.useState<WeightsConfig>({
    difficulty: defaultDifficulty,
    taskType: defaultTaskType,
    useIcons: defaultUseIcons,
    count: defaultCount,
  });

  const difficultyLabel = (d: number) => t(`weights.difficulty.${d}`);
  const typeLabel = (tp: WeightsConfig['taskType']) => t(`weights.type.${tp}`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Hidden inputs to submit the current config */}
      <input
        type="hidden"
        name="taskOptions[weights][difficulty]"
        value={String(cfg.difficulty)}
      />
      <input
        type="hidden"
        name="taskOptions[weights][type]"
        value={cfg.taskType}
      />
      <input
        type="hidden"
        name="taskOptions[weights][count]"
        value={String(cfg.count)}
      />
      <input
        type="hidden"
        name="taskOptions[weights][useIcons]"
        value={cfg.useIcons ? 'true' : 'false'}
      />

      {/* Summary of selected preferences */}
      <div className="gen-tags" style={{ flexWrap: 'wrap' }}>
        <span className="tag">
          {t('weights.summary.difficulty')}: {difficultyLabel(cfg.difficulty)}
        </span>
        <span className="tag">
          {t('weights.summary.type')}: {typeLabel(cfg.taskType)}
        </span>
        <span className="tag">
          {t('weights.summary.count')}: {cfg.count}
        </span>
        {cfg.useIcons && <span className="tag">{t('weights.summary.icons')}</span>}
      </div>

      <Modal open={open} onClose={onClose || (() => {})} title={t('weights.modal.title')}>
        <WeightsConfigForm value={cfg} onChange={setCfg} />
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

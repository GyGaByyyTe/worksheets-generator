'use client';
import React from 'react';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import PostmanConfigForm, {
  type PostmanConfig,
} from '@/components/PostmanConfigForm';
import { useT } from '@/i18n/I18nProvider';

export type PostmanPanelProps = {
  defaultDifficulty?: number; // 1..3
  open?: boolean; // controls modal visibility (from parent)
  onClose?: () => void;
};

export default function PostmanPanel({
  defaultDifficulty = 3,
  open = false,
  onClose,
}: PostmanPanelProps) {
  const t = useT();
  const [cfg, setCfg] = React.useState<PostmanConfig>({
    difficulty: defaultDifficulty,
    // defaults per difficulty (hard by default)
    lettersMin: defaultDifficulty === 1 ? 1 : defaultDifficulty === 2 ? 2 : 5,
    lettersMax: defaultDifficulty === 1 ? 3 : defaultDifficulty === 2 ? 4 : 6,
    missingMin: defaultDifficulty === 1 ? 1 : defaultDifficulty === 2 ? 2 : 3,
    missingMax: defaultDifficulty === 1 ? 4 : defaultDifficulty === 2 ? 4 : 5,
  });

  const difficultyLabel = (d: number) => t(`postman.difficulty.${d}`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Hidden inputs to submit the current config */}
      <input
        type="hidden"
        name="taskOptions[postman][difficulty]"
        value={String(cfg.difficulty)}
      />
      <input
        type="hidden"
        name="taskOptions[postman][lettersMin]"
        value={String(cfg.lettersMin)}
      />
      <input
        type="hidden"
        name="taskOptions[postman][lettersMax]"
        value={String(cfg.lettersMax)}
      />
      <input
        type="hidden"
        name="taskOptions[postman][missingMin]"
        value={String(cfg.missingMin)}
      />
      <input
        type="hidden"
        name="taskOptions[postman][missingMax]"
        value={String(cfg.missingMax)}
      />

      {/* Summary of selected preferences */}
      <div className="gen-tags" style={{ flexWrap: 'wrap' }}>
        <span className="tag">{difficultyLabel(cfg.difficulty)}</span>
        <span className="tag">
          {t('postman.summary.letters')}: {cfg.lettersMin}–{cfg.lettersMax}
        </span>
        <span className="tag">
          {t('postman.summary.missing')}: {cfg.missingMin}–{cfg.missingMax}
        </span>
      </div>

      <Modal
        open={open}
        onClose={onClose || (() => {})}
        title={t('postman.modal.title')}
      >
        <PostmanConfigForm value={cfg} onChange={setCfg} />
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

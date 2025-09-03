"use client";
import React from 'react';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import Select from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import Switch from '@/components/ui/switch';
import { useI18n, useT } from '@/i18n/I18nProvider';

export type FindPartsPanelConfig = {
  difficulty: number; // 1..3
  gridType: 'icons' | 'letters' | 'digits';
  multiSingle: boolean; // single large field with multiple shapes/words (only for icons)
  targetsCount: number; // 1..6: for multiSingle in icons mode and also number of words/sequences in letters/digits
};

export type FindPartsPanelProps = {
  open?: boolean;
  onClose?: () => void;
};

const STORAGE_KEY = 'findParts.config.v1';

export default function FindPartsPanel({ open = false, onClose }: FindPartsPanelProps) {
  const t = useT();
  const { lang } = useI18n();
  const [cfg, setCfg] = React.useState<FindPartsPanelConfig>({
    difficulty: 2,
    gridType: 'icons',
    multiSingle: false,
    targetsCount: 3,
  });

  // Load persisted cfg
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed.difficulty === 'number' &&
          (parsed.gridType === 'icons' || parsed.gridType === 'letters' || parsed.gridType === 'digits') &&
          typeof parsed.multiSingle === 'boolean' &&
          typeof parsed.targetsCount === 'number'
        ) {
          setCfg({
            difficulty: Math.min(3, Math.max(1, parsed.difficulty)),
            gridType: parsed.gridType,
            multiSingle: !!parsed.multiSingle,
            targetsCount: Math.min(6, Math.max(1, parsed.targetsCount)),
          });
        }
      }
    } catch {}
  }, []);

  // Persist cfg
  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch {}
  }, [cfg]);

  // Reset single-field mode if gridType is not 'icons'
  React.useEffect(() => {
    if (cfg.gridType !== 'icons' && cfg.multiSingle) {
      setCfg((p) => ({ ...p, multiSingle: false }));
    }
  }, [cfg.gridType]);

  // Hidden inputs for server submission
  // Note: words are not sent from UI anymore; backend will generate words based on lang & targetsCount
  // Also pass lang
  const hidden = (
    <>
      <input type="hidden" name="taskOptions[find-parts][difficulty]" value={String(cfg.difficulty)} />
      <input type="hidden" name="taskOptions[find-parts][gridType]" value={cfg.gridType} />
      <input type="hidden" name="taskOptions[find-parts][multiSearchSingleField]" value={cfg.multiSingle ? 'true' : 'false'} />
      <input type="hidden" name="taskOptions[find-parts][targetsCount]" value={String(cfg.targetsCount)} />
      <input type="hidden" name="taskOptions[find-parts][lang]" value={lang} />
    </>
  );

  const modal = (
    <Modal open={open} onClose={onClose || (() => {})} title={t('generator.params.findParts')}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          minWidth: 420,
        }}
      >
        {/* Difficulty */}
        <label className="ui-field">
          <div className="ui-field__label">{t('findParts.form.difficulty')}</div>
          <Select
            value={String(cfg.difficulty)}
            onChange={(e) =>
              setCfg((p) => ({ ...p, difficulty: Number((e.target as HTMLSelectElement).value) }))
            }
          >
            <option value="1">{t('findParts.difficulty.1')}</option>
            <option value="2">{t('findParts.difficulty.2')}</option>
            <option value="3">{t('findParts.difficulty.3')}</option>
          </Select>
        </label>

        {/* Grid type */}
        <label className="ui-field">
          <div className="ui-field__label">{t('findParts.form.gridType')}</div>
          <Select
            value={cfg.gridType}
            onChange={(e) => setCfg((p) => ({ ...p, gridType: (e.target as HTMLSelectElement).value as any }))}
          >
            <option value="icons">{t('findParts.gridType.icons')}</option>
            <option value="letters">{t('findParts.gridType.letters')}</option>
            <option value="digits">{t('findParts.gridType.digits')}</option>
          </Select>
        </label>

        {/* Targets count slider */}
        <div style={{ gridColumn: '1 / span 2' }}>
          <Slider
            min={1}
            max={6}
            step={1}
            value={cfg.targetsCount}
            onChange={(e) => setCfg((p) => ({ ...p, targetsCount: Number((e.target as HTMLInputElement).value) }))}
            label={t('findParts.form.targetsCount')}
            valueLabel={cfg.targetsCount}
          />
        </div>

        {/* Single field switch (icons only) */}
        {cfg.gridType === 'icons' && (
          <div style={{ gridColumn: '1 / span 2' }}>
            <Switch
              checked={cfg.multiSingle}
              onChange={(e) => setCfg((p) => ({ ...p, multiSingle: (e.target as HTMLInputElement).checked }))}
              label={t('findParts.form.modeSingle')}
            />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        <Button type="button" variant="outline" onClick={onClose}>{t('buttons.cancel')}</Button>
        <Button type="button" onClick={onClose}>{t('buttons.apply')}</Button>
      </div>
    </Modal>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {hidden}
      {/* Summary tags */}
      <div className="gen-tags" style={{ flexWrap: 'wrap' }}>
        <span className="tag">
          {t('findParts.summary.difficulty')}: {t(`findParts.difficulty.${cfg.difficulty}`)}
        </span>
        <span className="tag">
          {t('findParts.summary.gridType')}: {t(`findParts.gridType.${cfg.gridType}`)}
        </span>
        {cfg.gridType === 'icons' && cfg.multiSingle && (
          <span className="tag">{t('findParts.summary.singleField')}</span>
        )}
        <span className="tag">{t('findParts.summary.targetsCount')}: {cfg.targetsCount}</span>
      </div>

      {modal}
    </div>
  );
}

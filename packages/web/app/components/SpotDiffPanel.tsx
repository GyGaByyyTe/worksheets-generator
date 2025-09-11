'use client';
import React from 'react';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import Select from '@/components/ui/select';
import Switch from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useI18n, useT } from '@/i18n/I18nProvider';

export type SpotDiffConfig = {
  difficulty: number; // 1..3
  useShapes: boolean;
  useDigits: boolean;
  useLetters: boolean;
  letterLang: 'ru' | 'en';
  bw: boolean; // black & white printing (disable color diffs)
  objectCount?: number; // optional: total cells (approx). 9, 16, 25
  diffCount?: number; // optional: number of differences
};

export type SpotDiffPanelProps = {
  open?: boolean;
  onClose?: () => void;
};

const STORAGE_KEY = 'spotDiff.config.v1';

export default function SpotDiffPanel({
  open = false,
  onClose,
}: SpotDiffPanelProps) {
  const t = useT();
  const { lang } = useI18n();
  const [cfg, setCfg] = React.useState<SpotDiffConfig>({
    difficulty: 2,
    useShapes: true,
    useDigits: false,
    useLetters: false,
    letterLang: (lang as 'ru' | 'en') || 'ru',
    bw: false,
    objectCount: undefined,
    diffCount: undefined,
  });

  // Load persisted cfg
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && typeof p === 'object') {
          setCfg((prev) => ({
            ...prev,
            difficulty: Math.min(3, Math.max(1, Number(p.difficulty) || 2)),
            useShapes: !!p.useShapes,
            useDigits: !!p.useDigits,
            useLetters: !!p.useLetters,
            letterLang: p.letterLang === 'en' ? 'en' : 'ru',
            bw: !!p.bw,
            objectCount: Number.isFinite(Number(p.objectCount))
              ? Number(p.objectCount)
              : undefined,
            diffCount: Number.isFinite(Number(p.diffCount))
              ? Number(p.diffCount)
              : undefined,
          }));
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

  // Ensure at least one type selected
  React.useEffect(() => {
    if (!cfg.useShapes && !cfg.useDigits && !cfg.useLetters) {
      setCfg((p) => ({ ...p, useShapes: true }));
    }
  }, [cfg.useShapes, cfg.useDigits, cfg.useLetters]);

  const hidden = (
    <>
      <input
        type="hidden"
        name="taskOptions[spot-diff][difficulty]"
        value={String(cfg.difficulty)}
      />
      <input
        type="hidden"
        name="taskOptions[spot-diff][types]"
        value={[
          cfg.useShapes ? 'shapes' : null,
          cfg.useDigits ? 'digits' : null,
          cfg.useLetters ? 'letters' : null,
        ]
          .filter(Boolean)
          .join(',')}
      />
      <input
        type="hidden"
        name="taskOptions[spot-diff][letterLang]"
        value={cfg.letterLang}
      />
      <input
        type="hidden"
        name="taskOptions[spot-diff][bw]"
        value={cfg.bw ? 'true' : 'false'}
      />
      <input
        type="hidden"
        name="taskOptions[spot-diff][objectCount]"
        value={cfg.objectCount ? String(cfg.objectCount) : ''}
      />
      <input
        type="hidden"
        name="taskOptions[spot-diff][diffCount]"
        value={cfg.diffCount ? String(cfg.diffCount) : ''}
      />
      <input type="hidden" name="taskOptions[spot-diff][lang]" value={lang} />
    </>
  );

  const summary = (
    <div className="gen-tags" style={{ flexWrap: 'wrap' }}>
      {/* <span className="tag">
        {t(`postman.difficulty.${cfg.difficulty}`) || cfg.difficulty}
      </span> */}
      <span className="tag">
        {t('spotDiff.summary.types')}:{' '}
        {[
          cfg.useShapes ? t('spotDiff.form.type.shapes') : null,
          cfg.useDigits ? t('spotDiff.form.type.digits') : null,
          cfg.useLetters ? t('spotDiff.form.type.letters') : null,
        ]
          .filter(Boolean)
          .join(', ')}
      </span>
      {cfg.bw && <span className="tag">{t('spotDiff.summary.bw')}</span>}
      {cfg.objectCount && (
        <span className="tag">
          {t('spotDiff.form.objectCount')}: {cfg.objectCount}
        </span>
      )}
      {cfg.diffCount && (
        <span className="tag">
          {t('spotDiff.form.diffCount')}: {cfg.diffCount}
        </span>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {hidden}
      {summary}

      <Modal
        open={open}
        onClose={onClose || (() => {})}
        title={t('generator.params.spotDiff')}
      >
        <div className="form-grid">
          {/* <label>{t('spotDiff.form.difficulty')}</label>
          <div>
            <Slider
              value={cfg.difficulty}
              min={1}
              max={3}
              step={1}
              onValueChange={(v) =>
                setCfg((p) => ({
                  ...p,
                  difficulty: Math.min(3, Math.max(1, v[0] || 2)),
                }))
              }
            />
          </div> */}

          <label>{t('spotDiff.form.types')}</label>
          <div className="row" style={{ gap: 12 }}>
            <label className="row" style={{ gap: 8 }}>
              <Switch
                checked={cfg.useShapes}
                onChange={(e) =>
                  setCfg((p) => ({
                    ...p,
                    useShapes: (e.target as HTMLInputElement).checked,
                  }))
                }
              />
              {t('spotDiff.form.type.shapes')}
            </label>
            <label className="row" style={{ gap: 8 }}>
              <Switch
                checked={cfg.useDigits}
                onChange={(e) =>
                  setCfg((p) => ({
                    ...p,
                    useDigits: (e.target as HTMLInputElement).checked,
                  }))
                }
              />
              {t('spotDiff.form.type.digits')}
            </label>
            <label className="row" style={{ gap: 8 }}>
              <Switch
                checked={cfg.useLetters}
                onChange={(e) =>
                  setCfg((p) => ({
                    ...p,
                    useLetters: (e.target as HTMLInputElement).checked,
                  }))
                }
              />
              {t('spotDiff.form.type.letters')}
            </label>
          </div>

          {cfg.useLetters && (
            <>
              <label>{t('spotDiff.form.letterLang')}</label>
              <Select
                value={cfg.letterLang}
                onChange={(e) =>
                  setCfg((p) => ({
                    ...p,
                    letterLang: (e.target.value as 'ru' | 'en') || 'ru',
                  }))
                }
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </Select>
            </>
          )}

          <label>{t('spotDiff.form.bw')}</label>
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <Switch
              checked={cfg.bw}
              onChange={(e) =>
                setCfg((p) => ({
                  ...p,
                  bw: (e.target as HTMLInputElement).checked,
                }))
              }
            />
            <span className="muted">{t('spotDiff.form.bw.hint')}</span>
          </div>

          <label>{t('spotDiff.form.objectCount')}</label>
          <Select
            value={cfg.objectCount ? String(cfg.objectCount) : ''}
            onChange={(e) =>
              setCfg((p) => ({
                ...p,
                objectCount: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              }))
            }
          >
            <option value="">По умолчанию</option>
            <option value="9">9</option>
            <option value="16">16</option>
            <option value="25">25</option>
          </Select>

          <label>{t('spotDiff.form.diffCount')}</label>
          <Select
            value={cfg.diffCount ? String(cfg.diffCount) : ''}
            onChange={(e) =>
              setCfg((p) => ({
                ...p,
                diffCount: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          >
            <option value="">По умолчанию</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
          </Select>
        </div>

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

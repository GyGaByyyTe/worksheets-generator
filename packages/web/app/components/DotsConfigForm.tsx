'use client';
import React from 'react';
import { useT } from '../i18n/I18nProvider';
import type { ImageDotsParams, NumberingMode, PointsDistribution } from './ImageDotsTable';
import Slider from './ui/slider';
import Select from './ui/select';
import Switch from './ui/switch';
import FilePicker from './ui/file-picker';
import ImagePreview from './ui/image-preview';
import { apiBase } from '../lib/api';

// Local category/subcategory mapping (mirror ImageDotsTable)
const CATEGORY_MAP: Record<string, string[]> = {
  Animals: ['Cats', 'Dogs', 'Fish', 'Birds', 'Dinosaurs', 'Horses', 'Insects'],
  Technics: ['Cars', 'Planes', 'Trains', 'Ships', 'Robots', 'Gadgets'],
  Nature: ['Trees', 'Flowers', 'Mountains', 'Landscapes', 'Leaves'],
};

export type DotsConfigFormProps = {
  value: ImageDotsParams;
  onChange: (next: ImageDotsParams) => void;
  fileInputName?: string; // ensures file is submitted
  fileInputId?: string; // id of persistent hidden input in parent form
};

export default function DotsConfigForm({ value, onChange, fileInputName, fileInputId }: DotsConfigFormProps) {
  const t = useT();
  const update = (patch: Partial<ImageDotsParams>) => onChange({ ...value, ...patch });

  const getHiddenInput = React.useCallback(() => {
    if (!fileInputId) return null;
    return document.getElementById(fileInputId) as HTMLInputElement | null;
  }, [fileInputId]);

  const clearHiddenInput = React.useCallback(() => {
    const el = getHiddenInput();
    if (el) el.value = '';
  }, [getHiddenInput]);

  // Helpers
  const setSource = (src: 'upload' | 'random') => {
    if (src === 'upload') {
      update({ source: 'upload', imageUrl: '', previewUrl: '' });
    } else {
      clearHiddenInput();
      update({ source: 'random', file: null, imageUrl: '', previewUrl: '' });
    }
  };

  const pickRandom = async () => {
    try {
      const base = apiBase();
      const params = new URLSearchParams({
        category: String(value.category || 'Animals'),
        subcategory: String(value.subcategory || ''),
        type: 'silhouette',
        per_page: '20',
      });
      const resp = await fetch(`${base}/pictures/search?${params.toString()}`);
      const data = await resp.json();
      const image = data?.image;
      if (image && image.url) {
        update({ source: 'random', imageUrl: image.url, previewUrl: image.previewUrl });
      }
    } catch (_) {
      // ignore errors
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 320 }}>
      {/* Source selector + upload/random controls */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Select
          value={value.source || 'upload'}
          onChange={(e) => setSource(((e.target as HTMLSelectElement).value as 'upload' | 'random'))}
        >
          <option value="upload">{t('imageDots.source.upload') || 'Upload image'}</option>
          <option value="random">{t('imageDots.source.random') || 'Random from server'}</option>
        </Select>
        {(!value.source || value.source === 'upload') ? (
          <>
            <FilePicker
              accept="image/*"
              label={t('dotsForm.uploadImage') || t('table.image')}
              name={fileInputName}
              browseTarget={fileInputId ? getHiddenInput : undefined}
              onFile={!fileInputId ? (file) => update({ file: file || null, source: 'upload', imageUrl: '', previewUrl: '' }) : undefined}
            />
          </>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Select
              value={value.category || 'Animals'}
              onChange={(e) => {
                const cat = (e.target as HTMLSelectElement).value;
                const subs = CATEGORY_MAP[cat] || [];
                update({ category: cat, subcategory: subs[0] || '', imageUrl: '', previewUrl: '' });
              }}
            >
              {Object.keys(CATEGORY_MAP).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <Select
              value={value.subcategory || (CATEGORY_MAP[value.category || 'Animals']?.[0] || '')}
              onChange={(e) => update({ subcategory: (e.target as HTMLSelectElement).value })}
            >
              {(CATEGORY_MAP[value.category || 'Animals'] || []).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
            <button type="button" className="ui-btn ui-btn--outline" onClick={pickRandom}>
              {t('imageDots.pickRandom') || 'Pick Random'}
            </button>
          </div>
        )}
      </div>

      {/* Sliders grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Slider
          label={`${t('table.points')}: ${value.pointsCount}`}
          min={5}
          max={300}
          step={1}
          value={value.pointsCount}
          onChange={(e) => update({ pointsCount: Math.max(5, Math.min(300, Number((e.target as HTMLInputElement).value))) })}
        />
        <Slider
          label={`${t('table.threshold')}: ${value.threshold}`}
          min={0}
          max={255}
          step={1}
          value={value.threshold}
          onChange={(e) => update({ threshold: Math.max(0, Math.min(255, Number((e.target as HTMLInputElement).value))) })}
        />
        <Slider
          label={`${t('table.simplify')}: ${value.simplifyTolerance}`}
          min={0.1}
          max={10}
          step={0.1}
          value={value.simplifyTolerance}
          onChange={(e) => update({ simplifyTolerance: Math.max(0.1, Math.min(10, Number((e.target as HTMLInputElement).value))) })}
        />
        <Slider
          label={`${t('table.blur')}: ${value.blurSigma}`}
          min={0}
          max={10}
          step={0.1}
          value={value.blurSigma}
          onChange={(e) => update({ blurSigma: Math.max(0, Math.min(10, Number((e.target as HTMLInputElement).value))) })}
        />
      </div>

      {/* Dropdowns */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div className="ui-field__label">{t('table.numbering')}</div>
          <Select
            value={value.numbering}
            onChange={(e) => update({ numbering: (e.target as HTMLSelectElement).value as NumberingMode })}
          >
            <option value="continuous">{t('numbering.continuous')}</option>
            <option value="per-contour">{t('numbering.perContour')}</option>
          </Select>
        </div>
        <div>
          <div className="ui-field__label">{t('table.distribution')}</div>
          <Select
            value={value.pointsDistribution}
            onChange={(e) => update({ pointsDistribution: (e.target as HTMLSelectElement).value as PointsDistribution })}
          >
            <option value="proportional">{t('distribution.proportional')}</option>
            <option value="equal">{t('distribution.equal')}</option>
          </Select>
        </div>
      </div>

      {/* Switch */}
      <div>
        <div className="ui-field__label">{t('table.multiContours')}</div>
        <Switch
          checked={value.multiContours}
          onChange={(e) => update({ multiContours: (e.target as HTMLInputElement).checked })}
        />
      </div>

      {/* Image preview (upload or random) */}
      <ImagePreview
        file={value.file || undefined}
        url={!value.file ? (value.previewUrl || '') : undefined}
        note={value.category && value.subcategory ? (<span className="muted" style={{ fontSize: 12 }}>{value.category} / {value.subcategory}</span>) : undefined}
        onRemove={() => { clearHiddenInput(); update({ file: null, previewUrl: '', imageUrl: '' }); }}
        size={120}
      />
    </div>
  );
}

"use client";
import React from 'react';
import type { ImageDotsParams } from './components/ImageDotsTable';
import DaysSelector from './components/DaysSelector';
import TasksList from './components/TasksList';
import ConnectDotsPanel from './components/ConnectDotsPanel';
import ErrorAlert from './components/ErrorAlert';
import ResultsView from './components/ResultsView';
import { apiBase } from './lib/api';
import type { GenerateResponse } from './lib/types';

export default function Page() {
  const [tasks, setTasks] = React.useState<string[]>([]);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [days, setDays] = React.useState<number>(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<GenerateResponse | null>(null);

  // UI for custom connect-dots from images
  const [dotsRows, setDotsRows] = React.useState<ImageDotsParams[]>([]);
  const [lockToDays, setLockToDays] = React.useState<boolean>(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${apiBase()}/tasks`, { cache: 'no-store' });
        const data = await r.json();
        setTasks(data.keys || []);
      } catch (e) {
        console.error(e);
        setError('Не удалось загрузить список заданий.');
      }
    };
    load();
  }, []);

  const toggle = (k: string) => {
    setSelected(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]);
  };

  const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error('File read error'));
    fr.onload = () => resolve(String(fr.result || ''));
    fr.readAsDataURL(file);
  });

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);
    setResult(null);
    if (selected.length === 0) {
      setError('Выберите хотя бы один тип задания.');
      return;
    }
    setLoading(true);
    try {
      let imageDots: any[] | undefined = undefined;
      if (selected.includes('connect-dots') && dotsRows.length > 0) {
        const prepared = await Promise.all(dotsRows.map(async (r) => {
          if (!r.file) return null;
          const imageDataUrl = await fileToDataUrl(r.file);
          const targetContoursArr = (r.targetContours || '')
            .split(',')
            .map(s => Number((s || '').trim()))
            .filter(n => Number.isFinite(n));
          return {
            imageDataUrl,
            pointsCount: r.pointsCount,
            simplifyTolerance: r.simplifyTolerance,
            threshold: r.threshold,
            multiContours: r.multiContours,
            maxContours: r.maxContours,
            decorAreaRatio: r.decorAreaRatio,
            numbering: r.numbering,
            pointsDistribution: r.pointsDistribution,
            blurSigma: r.blurSigma,
            targetContours: targetContoursArr,
          };
        }));
        imageDots = prepared.filter(Boolean) as any[];
      }

      const payload: any = { days, tasks: selected };
      if (imageDots && imageDots.length > 0) payload.imageDots = imageDots;

      const r = await fetch(`${apiBase()}/generate/worksheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) throw new Error((data && (data.error || data.message)) || 'Ошибка генерации');
      setResult(data as GenerateResponse);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Ошибка запроса');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <form onSubmit={submit} className="panel">
        <DaysSelector days={days} onChange={setDays} />
        <TasksList tasks={tasks} selected={selected} onToggle={toggle} />

        {selected.includes('connect-dots') && (
          <ConnectDotsPanel
            days={days}
            lockToDays={lockToDays}
            setLockToDays={setLockToDays}
            dotsRows={dotsRows}
            setDotsRows={setDotsRows}
          />
        )}

        <div className="row">
          <button type="submit" disabled={loading}>{loading ? 'Генерация...' : 'Сгенерировать'}</button>
        </div>
      </form>

      <ErrorAlert message={error} />

      <ResultsView result={result} />
    </div>
  );
}

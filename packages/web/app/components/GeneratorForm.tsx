"use client";
import React, {useActionState} from 'react';
import { useFormStatus } from 'react-dom';
import type { ImageDotsParams } from './ImageDotsTable';
import DaysSelector from './DaysSelector';
import TasksList from './TasksList';
import ConnectDotsPanel from './ConnectDotsPanel';
import ErrorAlert from './ErrorAlert';
import ResultsView from './ResultsView';
import { apiBase } from '../lib/api';
import type { GenerateResponse } from '../lib/types';
import type { RefreshTasksState } from '../lib/types';

export type GeneratorFormProps = {
  initialTasks?: string[];
  refreshAction: (prevState: RefreshTasksState, formData: FormData) => Promise<RefreshTasksState>;
};

function RefreshButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Обновление...' : 'Обновить список заданий'}
    </button>
  );
}

export default function GeneratorForm({ initialTasks = [], refreshAction }: GeneratorFormProps) {
  const [tasks, setTasks] = React.useState<string[]>(initialTasks);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [days, setDays] = React.useState<number>(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<GenerateResponse | null>(null);

  const [refreshState, formAction] = useActionState(refreshAction, { tasks: initialTasks, error: null });

  React.useEffect(() => {
    if (refreshState?.tasks) setTasks(refreshState.tasks);
    if (refreshState?.error) setError(refreshState.error);
  }, [refreshState]);

  // UI for custom connect-dots from images
  const [dotsRows, setDotsRows] = React.useState<ImageDotsParams[]>([]);
  const [lockToDays, setLockToDays] = React.useState<boolean>(true);

  React.useEffect(() => {
    // if no initial tasks provided, fetch on client as a fallback
    if (tasks.length > 0) return;
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
    // we intentionally depend on tasks length only
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="row">
        <form action={formAction}>
          <RefreshButton />
        </form>
      </div>
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

"use client";
import React from 'react';

function apiBase() {
  const v = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL)
    ? process.env.NEXT_PUBLIC_API_URL
    : 'http://localhost:4000';
  // normalize: remove trailing slashes to prevent double slashes when concatenating
  return v.replace(/\/+$/, '');
}

function absUrl(u: string) {
  if (!u) return u;
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  const base = apiBase();
  if (u.startsWith('/')) return `${base}${u}`;
  return `${base}/${u}`;
}

type GenerateResponse = {
  outDir: string;
  days: { day: number; dir: string; files: string[]; indexHtml: string }[];
};

export default function Page() {
  const [tasks, setTasks] = React.useState<string[]>([]);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [days, setDays] = React.useState<number>(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<GenerateResponse | null>(null);

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
      const r = await fetch(`${apiBase()}/generate/worksheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days, tasks: selected }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data && data.error || 'Ошибка генерации');
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
        <div className="row">
          <label>Дней:</label>
          <input type="number" min={1} max={7} value={days} onChange={e => setDays(Number(e.target.value || 1))} />
        </div>
        <div className="row">
          <div className="tasks">
            <div className="tasks-title">Задания:</div>
            <div className="tasks-list">
              {tasks.map(k => (
                <label key={k} className="chk">
                  <input type="checkbox" checked={selected.includes(k)} onChange={() => toggle(k)} /> {k}
                </label>
              ))}
              {tasks.length === 0 && <div>Загрузка...</div>}
            </div>
          </div>
        </div>
        <div className="row">
          <button type="submit" disabled={loading}>{loading ? 'Генерация...' : 'Сгенерировать'}</button>
        </div>
      </form>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="results">
          <h2>Результаты</h2>
          <div className="outdir">Папка: <a href={absUrl(result.outDir)} target="_blank" rel="noreferrer">{absUrl(result.outDir)}</a></div>
          {result.days.map(d => (
            <div key={d.day} className="day">
              <h3>День {d.day} — <a href={absUrl(d.indexHtml)} target="_blank" rel="noreferrer">просмотр страниц</a></h3>
              <div className="images">
                {d.files.map((f, i) => (
                  <a key={i} href={absUrl(f)} target="_blank" rel="noreferrer"><img src={absUrl(f)} alt={`page ${i+1}`} /></a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

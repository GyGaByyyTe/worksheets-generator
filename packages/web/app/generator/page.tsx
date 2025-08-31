import React, { Suspense } from 'react';
import GeneratorForm from '../components/GeneratorForm';
import { getTasks } from './actions';

export const metadata = {
  title: 'Генерация — Worksheets Generator',
  description: 'Создайте персонализированные рабочие листы',
};

async function GeneratorInner() {
  const tasks = await getTasks();
  return <GeneratorForm tasks={tasks} />;
}

export default async function GeneratorPage() {
  return (
    <div className="container" style={{ padding: '16px 0' }}>
      <header style={{ marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Генератор Учебных Заданий</h1>
        <p className="muted" style={{ marginTop: 6 }}>
          Создайте персонализированные рабочие листы для обучения
        </p>
      </header>
      <Suspense
        fallback={<div className="panel">Загрузка параметров генерации…</div>}
      >
        <GeneratorInner />
      </Suspense>
    </div>
  );
}

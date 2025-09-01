'use client';
import React from 'react';
import { useT } from '../i18n/I18nProvider';
import type { TaskInfo } from '../lib/types';
import TaskCard from './TaskCard';

export type TasksListProps = {
  tasks: TaskInfo[];
  selected: string[];
  onToggle: (key: string) => void;
};

function groupByCategory(tasks: TaskInfo[]) {
  const groups: Record<string, TaskInfo[]> = {};
  for (const t of tasks) {
    const cat = t.category || 'other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(t);
  }
  return groups;
}

export default function TasksList({ tasks, selected, onToggle }: TasksListProps) {
  const t = useT();
  const groups = groupByCategory(tasks);
  const order = ['math', 'logic', 'art', 'language', 'memory', 'puzzles', 'other'];
  const keys = Object.keys(groups).sort((a, b) => order.indexOf(a) - order.indexOf(b));

  return (
    <div className="row">
      <div className="tasks">
        <div className="tasks-title">{t('tasks.title')}</div>
        {keys.map((catKey) => (
          <div key={catKey} style={{ marginBottom: 10 }}>
            <div className="tag" style={{ marginBottom: 8 }}>{t(`categories.${catKey}`)}</div>
            <div className="tasks-grid">
              {groups[catKey].map((task) => {
                const k = task.key;
                const checked = selected.includes(k);
                const title = t(`task.${k}.title`) || k;
                return (
                  <TaskCard
                    key={k}
                    k={k}
                    title={title}
                    checked={checked}
                    logo={task.logo}
                    onToggle={onToggle}
                  />
                );
              })}
            </div>
          </div>
        ))}
        {tasks.length === 0 && <div>{t('tasks.loading')}</div>}
      </div>
    </div>
  );
}

'use client';
import React from 'react';
import { useT } from '../i18n/I18nProvider';
import Checkbox from './ui/checkbox';
import type { TaskInfo } from '../lib/types';

export type TasksListProps = {
  tasks: TaskInfo[];
  selected: string[];
  onToggle: (key: string) => void;
};

export default function TasksList({
  tasks,
  selected,
  onToggle,
}: TasksListProps) {
  const t = useT();
  return (
    <div className="row">
      <div className="tasks">
        <div className="tasks-title">{t('tasks.title')}</div>
        <div className="tasks-list grid-cards">
          {tasks.map((task) => {
            const k = task.key;
            const checked = selected.includes(k);
            const title = t(`task.${k}.title`);
            const cat = task.category ? t(`categories.${task.category}`) : '';
            return (
              <div
                key={k}
                className="card"
                style={{ cursor: 'pointer' }}
                onClick={() => onToggle(k)}
              >
                <label
                  className="chk"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox name="tasks" value={k} checked={checked} onChange={() => onToggle(k)} />
                  {task.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={task.logo}
                      alt={title}
                      width={24}
                      height={24}
                      style={{ borderRadius: 4, objectFit: 'contain', background: '#fff' }}
                    />
                  ) : (
                    <span
                      aria-hidden
                      style={{
                        width: 24,
                        height: 24,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 4,
                        background: '#eef',
                        color: '#334',
                        fontWeight: 700,
                      }}
                    >
                      {(title || k).slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span style={{ fontWeight: 600 }}>{title}</span>
                  {cat && (<span className="tag" style={{ marginLeft: 'auto' }}>{cat}</span>)}
                </label>
              </div>
            );
          })}
          {tasks.length === 0 && <div>{t('tasks.loading')}</div>}
        </div>
      </div>
    </div>
  );
}

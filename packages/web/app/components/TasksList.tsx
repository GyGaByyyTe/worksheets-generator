'use client';
import React from 'react';
import { useT } from '../i18n/I18nProvider';
import Checkbox from './ui/checkbox';

export type TasksListProps = {
  tasks: string[];
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
        <div className="tasks-list">
          {tasks.map((k) => (
            <label key={k} className="chk">
              <Checkbox
                name="tasks"
                value={k}
                checked={selected.includes(k)}
                onChange={() => onToggle(k)}
              />
              {k}
            </label>
          ))}
          {tasks.length === 0 && <div>{t('tasks.loading')}</div>}
        </div>
      </div>
    </div>
  );
}

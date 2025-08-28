"use client";
import React from 'react';

export type TasksListProps = {
  tasks: string[];
  selected: string[];
  onToggle: (key: string) => void;
};

export default function TasksList({ tasks, selected, onToggle }: TasksListProps) {
  return (
    <div className="row">
      <div className="tasks">
        <div className="tasks-title">Задания:</div>
        <div className="tasks-list">
          {tasks.map(k => (
            <label key={k} className="chk">
              <input type="checkbox" checked={selected.includes(k)} onChange={() => onToggle(k)} /> {k}
            </label>
          ))}
          {tasks.length === 0 && <div>Загрузка...</div>}
        </div>
      </div>
    </div>
  );
}

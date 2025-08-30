'use client';
import React, { useActionState, useCallback } from 'react';
import type { ImageDotsParams } from './ImageDotsTable';
import DaysSelector from './DaysSelector';
import TasksList from './TasksList';
import ConnectDotsPanel from './ConnectDotsPanel';
import ErrorAlert from './ErrorAlert';
import ResultsView from './ResultsView';
import LoadingButton from './LoadingButton';
import { generateWorksheets, refreshTasks } from '../actions';
import type { GeneratorFormProps } from '../lib/types';
import { getDefaultGeneratorState, getDefaultTaskState } from '../lib/const';
import { useT } from '../i18n/I18nProvider';

export default function GeneratorForm({ tasks = [] }: GeneratorFormProps) {
  const t = useT();
  const [selected, setSelected] = React.useState<string[]>([]);
  const [days, setDays] = React.useState<number>(1);

  const [refreshState, refreshAction] = useActionState(
    refreshTasks,
    getDefaultTaskState(tasks),
  );

  const [generatorState, generatorAction] = useActionState(
    generateWorksheets,
    getDefaultGeneratorState(),
  );

  // UI for custom connect-dots from images
  const [dotsRows, setDotsRows] = React.useState<ImageDotsParams[]>([]);
  const [lockToDays, setLockToDays] = React.useState<boolean>(true);

  const toggle = useCallback(
    (k: string) =>
      setSelected((prev) =>
        prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
      ),
    [],
  );

  return (
    <div className="container">
      <div className="row">
        <form action={refreshAction}>
          <LoadingButton
            loadingLabel={t('actions.refreshing')}
            label={t('actions.refresh')}
          />
        </form>
      </div>
      <form
        action={generatorAction}
        className="panel"
        encType="multipart/form-data"
      >
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
          <LoadingButton />
        </div>
      </form>

      <ErrorAlert
        message={refreshState?.message || generatorState?.message || null}
      />

      <ResultsView result={generatorState.data} />
    </div>
  );
}

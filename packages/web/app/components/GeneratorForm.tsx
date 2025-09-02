'use client';
import React, { useActionState, useCallback } from 'react';
import type { ImageDotsParams } from '@/components/ImageDotsTable';
import DaysSelector from '@/components/DaysSelector';
import TasksList from '@/components/TasksList';
import ConnectDotsPanel from '@/components/ConnectDotsPanel';
import ErrorAlert from '@/components/ErrorAlert';
import ResultsView from '@/components/ResultsView';
import LoadingButton from '@/components/LoadingButton';
import { generateWorksheets, refreshTasks } from 'actions';
import type { GeneratorFormProps } from 'lib/types';
import { getDefaultGeneratorState, getDefaultTaskState } from 'lib/const';
import { useT } from '@/i18n/I18nProvider';

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

  const [openConnectDots, setOpenConnectDots] = React.useState<boolean>(true);

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
      <form action={generatorAction}>
        <div className="two-cols" style={{ alignItems: 'start' }}>
          <div className="panel">
            <DaysSelector days={days} onChange={setDays} />
            <TasksList tasks={tasks} selected={selected} onToggle={toggle} />
          </div>
          <div
            style={{
              minWidth: 320,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              position: 'sticky',
              top: 12,
            }}
          >
            <div className="panel">
              <div className="tasks-title">{t('tasks.selected')}</div>
              <div className="gen-tags" style={{ flexWrap: 'wrap' }}>
                {selected.map((k) => (
                  <span
                    key={k}
                    className="tag"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {t(`task.${k}.title`) || k}
                    <button
                      type="button"
                      className="ui-btn ui-btn--sm ui-btn--outline"
                      onClick={() => toggle(k)}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {selected.length === 0 && (
                  <span className="muted">{t('tasks.nothing_selected')}</span>
                )}
              </div>
            </div>

            {selected.includes('connect-dots') && (
              <div className="panel">
                <div
                  className="row"
                  style={{ justifyContent: 'space-between', width: '100%' }}
                >
                  <div style={{ fontWeight: 600 }}>
                    Параметры: Соедини точки
                  </div>
                  <button
                    type="button"
                    className="ui-btn ui-btn--sm ui-btn--outline"
                    onClick={() => setOpenConnectDots((v) => !v)}
                  >
                    {openConnectDots ? 'Свернуть' : 'Развернуть'}
                  </button>
                </div>
                {openConnectDots && (
                  <ConnectDotsPanel
                    days={days}
                    lockToDays={lockToDays}
                    setLockToDays={setLockToDays}
                    dotsRows={dotsRows}
                    setDotsRows={setDotsRows}
                  />
                )}
              </div>
            )}

            <div className="panel">
              <div className="row">
                <LoadingButton />
              </div>
            </div>

            <div className="panel">
              {/* Results on the right column */}
              <ResultsView result={generatorState.data} />
            </div>
          </div>
        </div>
      </form>

      <ErrorAlert
        message={refreshState?.message || generatorState?.message || null}
      />
    </div>
  );
}

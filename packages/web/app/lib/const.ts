import { GeneratorState, RefreshTasksState, TaskInfo } from './types';

export const getDefaultTaskState = (
  initialTasks: (string | TaskInfo)[] = [],
): RefreshTasksState => ({
  tasks: initialTasks.map((t) => (typeof t === 'string' ? t : t.key)),
  error: '',
  message: '',
});

export const getDefaultGeneratorState = (): GeneratorState => ({
  data: null,
  error: '',
  message: '',
});

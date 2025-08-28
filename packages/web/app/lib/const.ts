import { GeneratorState, RefreshTasksState } from './types';

export const getDefaultTaskState = (
  initialTasks: string[] = [],
): RefreshTasksState => ({
  tasks: initialTasks,
  error: '',
  message: '',
});

export const getDefaultGeneratorState = (): GeneratorState => ({
  data: null,
  error: '',
  message: '',
});

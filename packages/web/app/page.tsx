import GeneratorForm from './components/GeneratorForm';
import { refreshTasks } from './actions';
import { getDefaultTaskState } from './lib/const';

export default async function Page() {
  const data = await refreshTasks(getDefaultTaskState());
  const tasks: string[] = data.tasks;

  return <GeneratorForm tasks={tasks} />;
}

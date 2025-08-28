import GeneratorForm from './components/GeneratorForm';
import { apiBase } from './lib/api';
import { refreshTasks } from './actions';

export default async function Page() {
  let tasks: string[] = [];
  try {
    const r = await fetch(`${apiBase()}/tasks`, { cache: 'no-store' });
    const data = await r.json();
    tasks = data?.keys || [];
  } catch (e) {
    // Fail silently; the client component will attempt a client-side fetch as a fallback
    tasks = [];
  }

  return <GeneratorForm initialTasks={tasks} refreshAction={refreshTasks} />;
}

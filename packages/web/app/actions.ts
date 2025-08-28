"use server";

import { apiBase } from "./lib/api";
import type { RefreshTasksState } from "./lib/types";

export async function refreshTasks(prevState: RefreshTasksState, _formData: FormData): Promise<RefreshTasksState> {
  try {
    const r = await fetch(`${apiBase()}/tasks`, { cache: "no-store" });
    const data = await r.json();
    const tasks = (data?.keys as string[]) || [];
    return { tasks, error: null };
  } catch (e: any) {
    return { tasks: prevState?.tasks || [], error: e?.message || "Не удалось обновить список заданий" };
  }
}

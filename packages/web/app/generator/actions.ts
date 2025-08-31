'use server';

import { cache } from 'react';
import { apiBase } from '../lib/api';
import type { TaskInfo } from '../lib/types';

// Server-side cached fetch of available tasks info (keys primary, optional meta)
export const getTasks = cache(async (): Promise<TaskInfo[]> => {
  try {
    const r = await fetch(`${apiBase()}/tasks`, { next: { revalidate: 300 } });
    const data = await r.json();
    if (Array.isArray(data?.tasks)) {
      // Normalize to TaskInfo objects with a key present
      return (data.tasks as any[])
        .filter((t) => t && typeof t.key === 'string')
        .map((t) => ({ key: t.key, category: t.category, logo: t.logo }));
    }
    const keys = (data?.keys as string[]) || [];
    return keys.map((key) => ({ key }));
  } catch (e) {
    // graceful fallback to an empty list; a client has a refresh button
    return [];
  }
});

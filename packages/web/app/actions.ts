'use server';

import { apiBase } from './lib/api';
import { GeneratorState, RefreshTasksState } from './lib/types';

export async function refreshTasks(
  prevState: RefreshTasksState,
  _formData?: FormData,
): Promise<RefreshTasksState> {
  try {
    const r = await fetch(`${apiBase()}/tasks`, { cache: 'no-store' });
    const data = await r.json();
    const tasks = (data?.keys as string[]) || [];
    return { tasks, error: '', message: '' };
  } catch (_error) {
    return {
      tasks: prevState?.tasks || [],
      error: 'errors.load_tasks_title',
      message: 'errors.load_tasks_message',
    };
  }
}

const fileToDataUrl = async (file: File): Promise<string> => {
  const ab = await file.arrayBuffer();
  const base64 = Buffer.from(ab).toString('base64');
  const mime = (file as any).type || 'application/octet-stream';
  return `data:${mime};base64,${base64}`;
};

export const generateWorksheets = async (
  prevState: GeneratorState,
  formData: FormData,
): Promise<GeneratorState> => {
  const selected: string[] = [];
  let imageDots: any[] = [];
  let days = Number(formData.get('days') || 1);
  if (!Number.isFinite(days) || days < 1) days = 1;

  // Parse fields
  for (const [key, value] of formData.entries()) {
    if (key === 'tasks' && typeof value === 'string') {
      selected.push(value);
      continue;
    }

    const m = key.match(/^imageDots\[(\d+)\]\[(.+)\]$/);
    if (m) {
      const idx = Number(m[1]);
      const field = m[2];
      if (!imageDots[idx]) imageDots[idx] = {};
      if (value instanceof File) {
        imageDots[idx][field] = value;
      } else {
        imageDots[idx][field] = String(value);
      }
      continue;
    }
  }

  if (selected.length === 0) {
    return {
      data: prevState.data,
      error: 'errors.no_tasks',
      message: 'errors.no_tasks',
    };
  }

  try {
    if (selected.includes('connect-dots') && imageDots?.length > 0) {
      const prepared = await Promise.all(
        imageDots.map(async (r) => {
          if (!r.file) return null;
          const imageDataUrl = await fileToDataUrl(r.file);
          const targetContoursArr = (r.targetContours || '')
            .split(',')
            .map((s: string) => Number((s || '').trim()))
            .filter((n: number) => Number.isFinite(n));
          return {
            imageDataUrl,
            pointsCount: r.pointsCount,
            simplifyTolerance: r.simplifyTolerance,
            threshold: r.threshold,
            multiContours: r.multiContours,
            maxContours: r.maxContours,
            decorAreaRatio: r.decorAreaRatio,
            numbering: r.numbering,
            pointsDistribution: r.pointsDistribution,
            blurSigma: r.blurSigma,
            targetContours: targetContoursArr,
          };
        }),
      );
      imageDots = prepared.filter(Boolean) as any[];
    }

    const payload: any = { days, tasks: selected };
    if (imageDots && imageDots.length > 0) payload.imageDots = imageDots;

    const r = await fetch(`${apiBase()}/generate/worksheets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) throw new Error('errors.generate_failed');
    return {
      data,
      error: '',
      message: '',
    };
  } catch (_e: any) {
    return {
      data: prevState.data,
      error: 'errors.generate_failed',
      message: 'errors.generate_failed',
    };
  }
};

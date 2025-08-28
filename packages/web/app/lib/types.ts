export type GenerateResponse = {
  outDir: string;
  days: { day: number; dir: string; files: string[]; indexHtml: string }[];
};

export type RefreshTasksState = {
  tasks: string[];
  error?: string | null;
};

export type GenerateResponse = {
  outDir: string;
  days: { day: number; dir: string; files: string[]; indexHtml: string }[];
};

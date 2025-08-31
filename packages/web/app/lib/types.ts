export type GenerateResponse = {
  outDir: string;
  days: { day: number; dir: string; files: string[]; indexHtml: string }[];
};

export type GeneratorState = {
  data: GenerateResponse | null;
  error?: string;
  message?: string;
};

export type RefreshTasksState = {
  tasks: string[];
  error?: string;
  message?: string;
};

export type TaskInfo = {
  key: string;
  category?: string;
  logo?: string;
};

export type GeneratorFormProps = {
  tasks?: TaskInfo[];
  // refreshAction: (
  //   prevState: RefreshTasksState,
  //   formData: FormData,
  // ) => Promise<RefreshTasksState>;
};

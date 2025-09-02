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

export type Plan = { code: string; title: string; color?: string };

export interface Profile {
  id: string;
  email: string;
  name: string;
  plan: Plan;
  avatarUrl: string | null;
  joinedAt?: string;
}

export interface Stats {
  month: { used: number; limit: number };
  downloadsTotal: number;
  daysWithUs: number;
  rating: number | null;
}

export type AccountTab =
  | 'overview'
  | 'generations'
  | 'subscription'
  | 'settings';

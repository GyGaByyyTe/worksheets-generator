import type React from 'react';

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

// ========= UI component props/types =========
export type ButtonVariant = 'default' | 'secondary' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}
export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export interface FilePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  onFile?: (file: File | null) => void;
  browseTarget?: () => HTMLInputElement | null;
}
export interface ImagePreviewProps {
  file?: File | null;
  url?: string | null;
  label?: React.ReactNode;
  note?: React.ReactNode;
  onRemove?: () => void;
  size?: number; // square px
}
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
}
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}
export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  valueLabel?: string | number;
}
export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
}

// ========= Domain and app types =========
export type GenItem = {
  id: string;
  tags: string[];
  previewUrl: string;
  downloadUrl: string;
};
export type RecentGenItem = {
  id: string;
  tags: string[];
  previewUrl: string;
  downloadUrl: string;
  createdAt?: string | Date;
  days?: number;
  downloads?: number;
};

export type Category = {
  id: string;
  name: string;
  count: number;
  icon?: string;
};
export type GenCard = {
  id: string;
  title: string;
  tags: string[];
  views: number;
  likes: number;
};

// ========= Image dots generator =========
export type NumberingMode = 'continuous' | 'per-contour';
export type PointsDistribution = 'proportional' | 'equal';

export type ImageDotsParams = {
  file?: File | null;
  // image source options
  source?: 'upload' | 'random';
  category?: string;
  subcategory?: string;
  imageUrl?: string; // when source=random, chosen image URL
  previewUrl?: string; // UI-only preview
  // core params
  pointsCount: number;
  simplifyTolerance: number;
  threshold: number;
  multiContours: boolean;
  maxContours: number;
  decorAreaRatio: number; // 0..0.9
  numbering: NumberingMode;
  pointsDistribution: PointsDistribution;
  blurSigma: number;
  targetContours?: string; // comma-separated indices; UI-friendly; optional
};

export type ImageDotsTableProps = {
  rows: ImageDotsParams[];
  setRows: (rows: ImageDotsParams[]) => void;
  lockedCount?: number | null; // when provided, force rows.length === lockedCount
  baseIndex?: number; // optional index offset for naming
  writeNames?: boolean; // whether to render name attributes for form submit
  renderFileInput?: boolean; // whether to render file input element
};

export type ConnectDotsPanelProps = {
  days: number;
  lockToDays: boolean;
  setLockToDays: (v: boolean) => void;
  dotsRows: ImageDotsParams[];
  setDotsRows: (rows: ImageDotsParams[]) => void;
};

// ========= Component props =========
export type DotsConfigFormProps = {
  value: ImageDotsParams;
  onChange: (next: ImageDotsParams) => void;
  fileInputName?: string; // ensures file is submitted
  fileInputId?: string; // id of persistent hidden input in parent form
};

export type DayConfigCardProps = {
  title: string;
  description?: string;
  status?: string;
  statusColor?: string; // e.g. '#2c7' or '#999'
  onConfigure: () => void;
  actionLabel: string;
};

export type DaysSelectorProps = {
  days: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
};

export type ErrorAlertProps = { message: string | null };

export type ResultsViewProps = {
  result: GenerateResponse | null;
};

export type TaskCardProps = {
  k: string;
  title: string;
  checked: boolean;
  logo?: string;
  onToggle: (key: string) => void;
};

export type TasksListProps = {
  tasks: TaskInfo[];
  selected: string[];
  onToggle: (key: string) => void;
};

// ========= Auth & i18n =========
export type AuthUser = { id: string; email: string };

export type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refresh: () => Promise<void>;
};

export type I18nContextType = {
  lang: 'en' | 'ru';
  setLang: (l: 'en' | 'ru') => void;
  t: (key: string, params?: Record<string, any>) => string;
};

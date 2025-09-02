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

export type AccountTab = 'overview' | 'generations' | 'subscription' | 'settings';

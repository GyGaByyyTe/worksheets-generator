export function apiBase(): string {
  const v = (typeof process !== 'undefined' && (process as any).env?.NEXT_PUBLIC_API_URL)
    ? (process as any).env.NEXT_PUBLIC_API_URL as string
    : 'http://localhost:4000';
  // normalize: remove trailing slashes to prevent double slashes when concatenating
  return v.replace(/\/+$/, '');
}

export function absUrl(u: string): string {
  if (!u) return u;
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  const base = apiBase();
  if (u.startsWith('/')) return `${base}${u}`;
  return `${base}/${u}`;
}

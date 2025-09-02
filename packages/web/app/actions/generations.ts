"use server";

import { cache } from "react";
import { absUrl } from "../lib/api";

export type RecentGenItem = {
  id: string;
  tags: string[];
  previewUrl: string;
  downloadUrl: string;
  createdAt?: string | Date;
  days?: number;
  downloads?: number;
};

export const getRecentGenerations = cache(async function getRecentGenerations(opts?: {
  limit?: number;
  mine?: boolean;
  token?: string | null;
}): Promise<RecentGenItem[]> {
  const limit = opts?.limit ?? 4;
  const mine = opts?.mine ? 1 : 0;
  const url = absUrl(`/generations/recent?limit=${encodeURIComponent(String(limit))}&mine=${mine}`);
  const res = await fetch(url, {
    headers: opts?.token ? { Authorization: `Bearer ${opts.token}` } : undefined,
    cache: "no-store",
    // next: { revalidate: 0 } // explicit no-cache
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || `Failed to fetch: ${res.status}`);
  }
  const items = Array.isArray(json?.items) ? (json.items as RecentGenItem[]) : [];
  return items;
});

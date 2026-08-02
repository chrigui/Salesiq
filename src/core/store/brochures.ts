"use client";

import useSWR, { mutate as globalMutate } from "swr";
import type { BrochureSection } from "@/lib/serializers/brochure";

export type BrochureTemplate = "Modern" | "Luxury" | "Minimal";
export type BrochureTheme = "Light" | "Dark" | "Auto" | "Brand";
export type BrochureStatus = "Draft" | "Published" | "Archived";

export interface Brochure {
  id: string;
  createdAt: number;
  updatedAt: number;
  packId: string;
  itemId: string;
  slug: string;
  template: BrochureTemplate;
  theme: BrochureTheme;
  status: BrochureStatus;
  sections: BrochureSection[];
  brandingOverrides: Record<string, unknown> | null;
  publishedAt: number | null;
}

export interface BrochureAnalytics {
  views: number;
  scans: number;
  clicks: number;
  leads: number;
  daily: { date: string; views: number; scans: number; clicks: number; leads: number }[];
}

const BROCHURES_KEY = "/api/brochures";
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/** Live-updating list of the tenant's brochures, shared/deduped across consumers via SWR's cache. */
export function useBrochures(): { brochures: Brochure[]; isLoading: boolean } {
  const { data, isLoading } = useSWR<{ brochures: Brochure[] }>(BROCHURES_KEY, fetcher);
  return { brochures: data?.brochures ?? [], isLoading: isLoading && data === undefined };
}

export function useBrochure(id: string | null): { brochure: Brochure | null; isLoading: boolean } {
  const { data, isLoading } = useSWR<{ brochure: Brochure }>(
    id ? `${BROCHURES_KEY}/${id}` : null,
    fetcher,
  );
  return { brochure: data?.brochure ?? null, isLoading: isLoading && data === undefined };
}

export function useBrochureAnalytics(id: string | null): BrochureAnalytics | null {
  const { data } = useSWR<{ analytics: BrochureAnalytics }>(
    id ? `${BROCHURES_KEY}/${id}/analytics` : null,
    fetcher,
    { refreshInterval: 15_000 },
  );
  return data?.analytics ?? null;
}

export async function createBrochure(input: {
  packId: string;
  itemId: string;
  template?: BrochureTemplate;
  theme?: BrochureTheme;
}): Promise<Brochure | null> {
  const res = await fetch(BROCHURES_KEY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) return null;
  const { brochure } = await res.json();
  globalMutate(BROCHURES_KEY);
  return brochure as Brochure;
}

export async function updateBrochure(
  id: string,
  patch: Partial<Pick<Brochure, "template" | "theme" | "sections" | "brandingOverrides" | "status">>,
): Promise<Brochure | null> {
  const res = await fetch(`${BROCHURES_KEY}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  globalMutate(`${BROCHURES_KEY}/${id}`);
  globalMutate(BROCHURES_KEY);
  if (!res.ok) return null;
  const { brochure } = await res.json();
  return brochure as Brochure;
}

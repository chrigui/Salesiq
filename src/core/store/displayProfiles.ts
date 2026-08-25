"use client";

import useSWR, { mutate as globalMutate } from "swr";
import type { DisplaySection, DisplayMotionConfig, DisplayProfileAssetMeta } from "@/lib/serializers/displayProfile";

export type DisplayTemplate =
  | "Minimal"
  | "NewDevelopment"
  | "Detailed"
  | "Lifestyle"
  | "Investment"
  | "LuxuryCinematic"
  | "Cinematic"
  | "Masterplan"
  | "Custom"
  | "Dashboard";
export type DisplayProfileStatus = "Draft" | "Published" | "Archived";
export type DisplayProfileLayout = "Stack" | "Grid";

export interface DisplayProfile {
  id: string;
  createdAt: number;
  updatedAt: number;
  name: string;
  packId: string;
  itemId: string;
  template: DisplayTemplate;
  layout: DisplayProfileLayout;
  status: DisplayProfileStatus;
  sections: DisplaySection[];
  brandProfileId: string | null;
  resolvedBrandProfile: { brand: string | null; brandSoft: string | null; logoGlyph: string | null } | null;
  brandOverrides: { brand?: string; brandSoft?: string } | null;
  motion: DisplayMotionConfig;
  idle: Record<string, unknown> | null;
  publishedAt: number | null;
  assets: DisplayProfileAssetMeta[];
}

const PROFILES_KEY = "/api/display-profiles";
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/** Live-updating list of the tenant's Display Studio profiles, shared/deduped across consumers via SWR's cache. */
export function useDisplayProfiles(): { profiles: DisplayProfile[]; isLoading: boolean } {
  const { data, isLoading } = useSWR<{ profiles: DisplayProfile[] }>(PROFILES_KEY, fetcher);
  return { profiles: data?.profiles ?? [], isLoading: isLoading && data === undefined };
}

export function useDisplayProfile(id: string | null): { profile: DisplayProfile | null; isLoading: boolean } {
  const { data, isLoading } = useSWR<{ profile: DisplayProfile }>(
    id ? `${PROFILES_KEY}/${id}` : null,
    fetcher,
  );
  return { profile: data?.profile ?? null, isLoading: isLoading && data === undefined };
}

/**
 * What the live Customer Display polls: is there a Published profile for
 * the item currently focused on? Hits the deliberately-public runtime
 * resolver (see src/app/api/display-profiles/resolve/route.ts), not the
 * capability-gated editor routes above — a paired Display has no login.
 * Polls every 30s so a publish reaches an already-open Display without a
 * page reload; returns null (not a loading flicker) when nothing resolves,
 * which the caller treats as "render the existing hardcoded stage."
 */
export function useResolvedDisplayProfile(
  packId: string | null,
  itemId: string | null,
): DisplayProfile | null {
  const key = packId && itemId ? `/api/display-profiles/resolve?packId=${encodeURIComponent(packId)}&itemId=${encodeURIComponent(itemId)}` : null;
  const { data } = useSWR<{ profile: DisplayProfile | null }>(key, fetcher, { refreshInterval: 30_000 });
  return data?.profile ?? null;
}

export async function createDisplayProfile(input: {
  packId: string;
  itemId: string;
  name?: string;
  template?: DisplayTemplate;
}): Promise<DisplayProfile | null> {
  const res = await fetch(PROFILES_KEY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) return null;
  const { profile } = await res.json();
  globalMutate(PROFILES_KEY);
  return profile as DisplayProfile;
}

export async function updateDisplayProfile(
  id: string,
  patch: Partial<Pick<DisplayProfile, "name" | "template" | "layout" | "sections" | "brandProfileId" | "brandOverrides" | "motion" | "status">> & {
    changeReason?: string;
  },
): Promise<DisplayProfile | null> {
  const res = await fetch(`${PROFILES_KEY}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  globalMutate(`${PROFILES_KEY}/${id}`);
  globalMutate(PROFILES_KEY);
  globalMutate(`${PROFILES_KEY}/${id}/versions`);
  if (!res.ok) return null;
  const { profile } = await res.json();
  return profile as DisplayProfile;
}

export interface DisplayProfileVersion {
  id: string;
  version: number;
  isCurrent: boolean;
  authorName: string | null;
  changeReason: string;
  createdAt: number;
}

export function useDisplayProfileVersions(id: string | null): { versions: DisplayProfileVersion[]; isLoading: boolean } {
  const { data, isLoading } = useSWR<{ versions: DisplayProfileVersion[] }>(
    id ? `${PROFILES_KEY}/${id}/versions` : null,
    fetcher,
  );
  return { versions: data?.versions ?? [], isLoading: isLoading && data === undefined };
}

export async function revertDisplayProfile(id: string, versionId: string): Promise<DisplayProfile | null> {
  const res = await fetch(`${PROFILES_KEY}/${id}/versions/${versionId}/revert`, { method: "POST" });
  globalMutate(`${PROFILES_KEY}/${id}`);
  globalMutate(PROFILES_KEY);
  globalMutate(`${PROFILES_KEY}/${id}/versions`);
  if (!res.ok) return null;
  const { profile } = await res.json();
  return profile as DisplayProfile;
}

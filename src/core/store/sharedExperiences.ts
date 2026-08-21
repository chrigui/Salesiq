"use client";

import useSWR from "swr";

export interface SharedExperience {
  id: string;
  code: string;
  packId: string;
  itemIds: string[];
  focusedItemId: string | null;
  proposalText: string | null;
  proposalEngine: string | null;
  customerName: string | null;
  createdAt: number;
  expiresAt: number | null;
}

export interface SharedExperienceAnalytics {
  views: number;
  itemClicks: number;
  proposalViews: number;
  daily: { date: string; views: number; itemClicks: number; proposalViews: number }[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/** Creates a real, shareable snapshot of the current live session — session-authenticated, no capability gate (any salesperson can share their own session). */
export async function createSharedExperience(input: {
  packId: string;
  itemIds: string[];
  focusedItemId?: string | null;
  proposalText?: string | null;
  proposalEngine?: string | null;
  customerName?: string | null;
}): Promise<SharedExperience | null> {
  const res = await fetch("/api/shared-experiences", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) return null;
  const { sharedExperience } = await res.json();
  return sharedExperience as SharedExperience;
}

/** Polls a share's real analytics every 15s — same cadence as useBrochureAnalytics — so a freshly opened link shows up without a manual refresh. */
export function useSharedExperienceAnalytics(id: string | null): SharedExperienceAnalytics | null {
  const { data } = useSWR<{ analytics: SharedExperienceAnalytics }>(
    id ? `/api/shared-experiences/${id}/analytics` : null,
    fetcher,
    { refreshInterval: 15_000 },
  );
  return data?.analytics ?? null;
}

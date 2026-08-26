"use client";

import useSWR from "swr";
import type { RecapMessageTemplateKind } from "@/core/data/recapMessageTemplates";
import type { RecapSectionVisibility } from "@/core/data/recapSections";
import type { RecapEventCounts, RecapEngagementSummary } from "@/lib/recaps/signals";

export interface RecapSalespersonMessageInput {
  templateKind: RecapMessageTemplateKind;
  text: string;
  advisorPhone?: string;
}

export interface CreateRecapInput {
  packId: string;
  answers: Record<string, unknown>;
  shortlistItemIds: string[];
  compareItemIds?: string[];
  finalRecommendationItemId?: string | null;
  customerName?: string | null;
  buyerProfileId?: string | null;
  salespersonMessage?: RecapSalespersonMessageInput | null;
  nextSteps?: string[];
  sectionVisibility?: RecapSectionVisibility;
  privateNotes?: string | null;
}

export interface RecapResult {
  id: string;
  code: string;
  status: string;
}

/**
 * Mints a persistent, revisitable LUMMA Recap from the live session —
 * session-authenticated, no capability gate, same trust model as
 * createSharedExperience: any logged-in salesperson can turn their own
 * session into a shareable artifact.
 */
export async function createRecap(input: CreateRecapInput): Promise<RecapResult | null> {
  const res = await fetch("/api/recaps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) return null;
  const { recap } = await res.json();
  return recap as RecapResult;
}

export interface RecapAnalytics {
  counts: RecapEventCounts;
  engagement: RecapEngagementSummary;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/** Polls a Recap's real engagement every 15s — same cadence as useSharedExperienceAnalytics/useBrochureAnalytics — so a customer's activity shows up without a manual refresh. */
export function useRecapAnalytics(id: string | null): RecapAnalytics | null {
  const { data } = useSWR<{ analytics: RecapAnalytics }>(id ? `/api/recaps/${id}/analytics` : null, fetcher, {
    refreshInterval: 15_000,
  });
  return data?.analytics ?? null;
}

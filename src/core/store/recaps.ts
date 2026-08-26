"use client";

import type { RecapMessageTemplateKind } from "@/core/data/recapMessageTemplates";
import type { RecapSectionVisibility } from "@/core/data/recapSections";

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

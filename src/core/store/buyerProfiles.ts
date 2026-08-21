"use client";

import useSWR, { mutate as globalMutate } from "swr";
import type { BuyerField } from "@/core/buyerIntelligence/types";
import type { BuyerPriority } from "@/core/buyerIntelligence/priorityWeights";
import { useSession } from "@/core/store/session";

export interface BuyerProfile {
  id: string;
  branchId: string | null;
  name: string;
  email: string;
  phone: string;
  preferredLanguage: string | null;
  market: string | null;
  leadSource: string;
  assignedToId: string | null;
  assignedToName: string | null;

  requirements: Record<string, BuyerField<unknown>> | null;
  financial: Record<string, BuyerField<unknown>> | null;
  purposes: string[];
  motivations: { id: string; label: string; tier: "primary" | "secondary"; evidence: string[] }[] | null;
  priorities: BuyerPriority[] | null;
  preferences: Record<string, unknown> | null;

  intentLevel: string | null;
  intentReasons: string[] | null;
  intentUpdatedAt: number | null;

  purchaseReadiness: string | null;
  purchaseReadinessConfidence: number | null;
  purchaseReadinessSignals: string[] | null;

  lastInteractionAt: number | null;
  createdAt: number;
  updatedAt: number;
}

const BUYER_PROFILES_KEY = "/api/buyer-profiles";
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/** Live-updating list of buyer profiles this signed-in role can see (branch-scoped for reps, tenant-wide for Manager+), shared/deduped across consumers via SWR's cache. */
export function useBuyerProfiles(): { buyerProfiles: BuyerProfile[]; isLoading: boolean } {
  const { data, isLoading } = useSWR<{ buyerProfiles: BuyerProfile[] }>(BUYER_PROFILES_KEY, fetcher);
  return { buyerProfiles: data?.buyerProfiles ?? [], isLoading: isLoading && data === undefined };
}

export function useBuyerProfile(id: string | null): { buyerProfile: BuyerProfile | null; isLoading: boolean } {
  const { data, isLoading } = useSWR<{ buyerProfile: BuyerProfile }>(
    id ? `${BUYER_PROFILES_KEY}/${id}` : null,
    fetcher,
  );
  return { buyerProfile: data?.buyerProfile ?? null, isLoading: isLoading && data === undefined };
}

/**
 * Resolves (matching or creating) a BuyerProfile for the given contact info
 * and links the live Companion session to it — the single entry point every
 * capture surface should call once it has a name plus an email or phone.
 * Session-authenticated, no capability gate (mirrors saving a lead). Returns
 * null when there isn't enough contact info to identify anyone yet.
 */
export async function linkBuyerProfile(input: {
  name: string;
  email?: string;
  phone?: string;
}): Promise<BuyerProfile | null> {
  const res = await fetch(`${BUYER_PROFILES_KEY}/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) return null;
  const { buyerProfile } = await res.json();
  useSession.getState().linkBuyerProfile(buyerProfile.id);
  return buyerProfile as BuyerProfile;
}

export type BuyerProfilePatch = Partial<
  Pick<BuyerProfile, "requirements" | "financial" | "purposes" | "motivations" | "priorities">
>;

/** Edits a buyer's explicit-tagged fields — requirements/financial changes that overwrite a previous value are recorded as history server-side, never silently lost. */
export async function updateBuyerProfile(id: string, patch: BuyerProfilePatch): Promise<BuyerProfile | null> {
  const res = await fetch(`${BUYER_PROFILES_KEY}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  globalMutate(`${BUYER_PROFILES_KEY}/${id}`);
  globalMutate(BUYER_PROFILES_KEY);
  globalMutate(`${BUYER_PROFILES_KEY}/${id}/requirement-changes`);
  if (!res.ok) return null;
  const { buyerProfile } = await res.json();
  return buyerProfile as BuyerProfile;
}

export interface BuyerRequirementChange {
  id: string;
  field: string;
  previousValue: unknown;
  newValue: unknown;
  source: string;
  createdAt: number;
}

export function useBuyerRequirementChanges(id: string | null): { changes: BuyerRequirementChange[]; isLoading: boolean } {
  const { data, isLoading } = useSWR<{ changes: BuyerRequirementChange[] }>(
    id ? `${BUYER_PROFILES_KEY}/${id}/requirement-changes` : null,
    fetcher,
  );
  return { changes: data?.changes ?? [], isLoading: isLoading && data === undefined };
}

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

export interface BuyerExtractionFields {
  familySize?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  budget?: string;
  preferredLocation?: string;
  purposes?: string[];
  priorityLabel?: string;
  secondaryLabel?: string;
}

/** Proposes structured fields from free text — never writes anywhere on its own. The caller must still confirm/edit/reject via submitConversationNote. */
export async function extractBuyerText(
  text: string,
): Promise<{ extracted: BuyerExtractionFields; engine: string } | null> {
  const res = await fetch("/api/ai/buyer-extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) return null;
  return res.json();
}

/** CONFIRM/EDIT/REJECT for a natural-language capture — the only place an extraction is actually trusted onto a BuyerProfile. */
export async function submitConversationNote(
  buyerProfileId: string,
  input: {
    rawText: string;
    extracted: BuyerExtractionFields;
    status: "confirmed" | "edited" | "rejected";
    confirmedFields?: BuyerExtractionFields;
  },
): Promise<boolean> {
  const res = await fetch(`${BUYER_PROFILES_KEY}/${buyerProfileId}/conversation-notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  globalMutate(`${BUYER_PROFILES_KEY}/${buyerProfileId}`);
  globalMutate(`${BUYER_PROFILES_KEY}/${buyerProfileId}/requirement-changes`);
  globalMutate(`${BUYER_PROFILES_KEY}/${buyerProfileId}/conversation-notes`);
  return res.ok;
}

export interface BuyerConversationNote {
  id: string;
  rawText: string;
  extracted: BuyerExtractionFields;
  status: "pending" | "confirmed" | "edited" | "rejected";
  confirmedFields: BuyerExtractionFields | null;
  createdByName: string | null;
  createdAt: number;
}

export function useBuyerConversationNotes(id: string | null): { notes: BuyerConversationNote[]; isLoading: boolean } {
  const { data, isLoading } = useSWR<{ notes: BuyerConversationNote[] }>(
    id ? `${BUYER_PROFILES_KEY}/${id}/conversation-notes` : null,
    fetcher,
  );
  return { notes: data?.notes ?? [], isLoading: isLoading && data === undefined };
}

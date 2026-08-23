"use client";

import useSWR, { mutate as globalMutate } from "swr";
import type { BuyerField } from "@/core/buyerIntelligence/types";
import type { BuyerPriority } from "@/core/buyerIntelligence/priorityWeights";
import type { BuyerSegmentCriterion } from "@/core/buyerIntelligence/segments";
import type { SimilarBuyerMatch } from "@/core/buyerIntelligence/similarity";
import type { Condition } from "@/core/types";
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

export type BuyerActivityKind = "property_viewed" | "item_saved" | "comparison_made" | "proposal_generated";

export interface BuyerActivityEvent {
  id: string;
  kind: string;
  packId: string | null;
  itemId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: number;
}

export interface BuyerItemRelationship {
  id: string;
  packId: string;
  itemId: string;
  state: string;
  context: Record<string, unknown> | null;
  createdAt: number;
}

/**
 * Logs a passive behavioral signal from the buyer's own linked live session
 * (item viewed, bookmarked, a proposal generated) — only ever called from
 * Companion-specific interaction points, never from the shared session store
 * itself, so customer-facing surfaces can never trigger a write. Best-effort:
 * a failed log never blocks the salesperson's UI action it rides along with.
 */
export async function logBuyerActivity(
  buyerProfileId: string,
  input: { kind: BuyerActivityKind; packId?: string; itemId?: string; meta?: Record<string, unknown> },
): Promise<void> {
  try {
    await fetch(`${BUYER_PROFILES_KEY}/${buyerProfileId}/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    // best-effort — never blocks the UI action it rides along with
  }
  globalMutate(`${BUYER_PROFILES_KEY}/${buyerProfileId}/activity`);
}

export function useBuyerActivity(
  id: string | null,
): { events: BuyerActivityEvent[]; relationships: BuyerItemRelationship[]; isLoading: boolean } {
  const { data, isLoading } = useSWR<{ events: BuyerActivityEvent[]; relationships: BuyerItemRelationship[] }>(
    id ? `${BUYER_PROFILES_KEY}/${id}/activity` : null,
    fetcher,
  );
  return { events: data?.events ?? [], relationships: data?.relationships ?? [], isLoading: isLoading && data === undefined };
}

export interface BuyerRejectedItem {
  id: string;
  packId: string;
  itemId: string;
  reason: string;
  source: string;
  overriddenAt: number | null;
  createdAt: number;
}

export function useBuyerRejectedItems(id: string | null): { rejectedItems: BuyerRejectedItem[]; isLoading: boolean } {
  const { data, isLoading } = useSWR<{ rejectedItems: BuyerRejectedItem[] }>(
    id ? `${BUYER_PROFILES_KEY}/${id}/rejected-items` : null,
    fetcher,
  );
  return { rejectedItems: data?.rejectedItems ?? [], isLoading: isLoading && data === undefined };
}

/** Deliberate reject action, distinct from logBuyerActivity's passive tracking — always requires a reason. */
export async function rejectBuyerItem(
  buyerProfileId: string,
  input: { packId: string; itemId: string; reason: string },
): Promise<boolean> {
  const res = await fetch(`${BUYER_PROFILES_KEY}/${buyerProfileId}/rejected-items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  globalMutate(`${BUYER_PROFILES_KEY}/${buyerProfileId}/rejected-items`);
  globalMutate(`${BUYER_PROFILES_KEY}/${buyerProfileId}/activity`);
  return res.ok;
}

export async function overrideRejectedItem(buyerProfileId: string, rejectedItemId: string): Promise<boolean> {
  const res = await fetch(`${BUYER_PROFILES_KEY}/${buyerProfileId}/rejected-items/${rejectedItemId}`, {
    method: "PATCH",
  });
  globalMutate(`${BUYER_PROFILES_KEY}/${buyerProfileId}/rejected-items`);
  return res.ok;
}

export interface BuyerObjection {
  id: string;
  kind: string;
  confidence: "high" | "medium" | "low";
  evidence: string[];
  resolvedAt: number | null;
  createdAt: number;
}

/** Persists an objection raised in the live Objection Handler onto this buyer's record — best-effort, never blocks the handler's own response flow. */
export async function logBuyerObjection(buyerProfileId: string, rawText: string): Promise<void> {
  try {
    await fetch(`${BUYER_PROFILES_KEY}/${buyerProfileId}/objections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText }),
    });
  } catch {
    // best-effort
  }
  globalMutate(`${BUYER_PROFILES_KEY}/${buyerProfileId}/objections`);
  globalMutate(`${BUYER_PROFILES_KEY}/${buyerProfileId}`);
}

export function useBuyerObjections(id: string | null): { objections: BuyerObjection[]; isLoading: boolean } {
  const { data, isLoading } = useSWR<{ objections: BuyerObjection[] }>(
    id ? `${BUYER_PROFILES_KEY}/${id}/objections` : null,
    fetcher,
  );
  return { objections: data?.objections ?? [], isLoading: isLoading && data === undefined };
}

export async function resolveBuyerObjection(buyerProfileId: string, objectionId: string): Promise<boolean> {
  const res = await fetch(`${BUYER_PROFILES_KEY}/${buyerProfileId}/objections/${objectionId}`, { method: "PATCH" });
  globalMutate(`${BUYER_PROFILES_KEY}/${buyerProfileId}/objections`);
  globalMutate(`${BUYER_PROFILES_KEY}/${buyerProfileId}`);
  return res.ok;
}

export interface TimelineEntry {
  id: string;
  ts: number;
  kind: "activity" | "relationship" | "requirement-change" | "conversation" | "objection";
  title: string;
  detail?: string;
  meta?: string;
}

/** Wave 2 — one merged, chronological feed across every category Buyer Intelligence tracks (see the /timeline route for exactly which sources and why some are deliberately deduplicated). */
export function useBuyerTimeline(id: string | null): { entries: TimelineEntry[]; isLoading: boolean } {
  const { data, isLoading } = useSWR<{ entries: TimelineEntry[] }>(
    id ? `${BUYER_PROFILES_KEY}/${id}/timeline` : null,
    fetcher,
  );
  return { entries: data?.entries ?? [], isLoading: isLoading && data === undefined };
}

/** Wave 2 — real, explainable similarity matches for this buyer, computed on demand (see findSimilarBuyers for the scoring and why every match carries its actual shared reasons instead of a bare score). */
export function useSimilarBuyers(id: string | null): { matches: SimilarBuyerMatch[]; isLoading: boolean } {
  const { data, isLoading } = useSWR<{ matches: SimilarBuyerMatch[] }>(
    id ? `${BUYER_PROFILES_KEY}/${id}/similar` : null,
    fetcher,
  );
  return { matches: data?.matches ?? [], isLoading: isLoading && data === undefined };
}

export interface BuyerSegment {
  id: string;
  name: string;
  criteria: BuyerSegmentCriterion[];
  createdById: string | null;
  createdByName: string | null;
  createdAt: number;
  updatedAt: number;
  buyerCount: number;
}

const BUYER_SEGMENTS_KEY = "/api/buyer-segments";

/** Wave 2 — every buyer segment for this tenant, each with a live buyer count computed fresh on every read (see compileSegmentWhere — a segment is a saved filter, never a stored membership list). */
export function useBuyerSegments(): { segments: BuyerSegment[]; isLoading: boolean } {
  const { data, isLoading } = useSWR<{ segments: BuyerSegment[] }>(BUYER_SEGMENTS_KEY, fetcher);
  return { segments: data?.segments ?? [], isLoading: isLoading && data === undefined };
}

/** The drill-in list behind a segment's live count — same scope + criteria, actual buyer rows. */
export function useSegmentBuyers(segmentId: string | null): { buyerProfiles: BuyerProfile[]; isLoading: boolean } {
  const { data, isLoading } = useSWR<{ buyerProfiles: BuyerProfile[] }>(
    segmentId ? `${BUYER_SEGMENTS_KEY}/${segmentId}/buyers` : null,
    fetcher,
  );
  return { buyerProfiles: data?.buyerProfiles ?? [], isLoading: isLoading && data === undefined };
}

export async function createBuyerSegment(name: string, criteria: BuyerSegmentCriterion[]): Promise<boolean> {
  const res = await fetch(BUYER_SEGMENTS_KEY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, criteria }),
  });
  globalMutate(BUYER_SEGMENTS_KEY);
  return res.ok;
}

export async function updateBuyerSegment(
  id: string,
  patch: { name?: string; criteria?: BuyerSegmentCriterion[] },
): Promise<boolean> {
  const res = await fetch(`${BUYER_SEGMENTS_KEY}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  globalMutate(BUYER_SEGMENTS_KEY);
  globalMutate(`${BUYER_SEGMENTS_KEY}/${id}/buyers`);
  return res.ok;
}

export async function deleteBuyerSegment(id: string): Promise<boolean> {
  const res = await fetch(`${BUYER_SEGMENTS_KEY}/${id}`, { method: "DELETE" });
  globalMutate(BUYER_SEGMENTS_KEY);
  return res.ok;
}

export interface NextBestActionResult {
  suggestion: string | null;
  source: "rule" | "fallback";
}

/** Wave 2 — tenant rules first, the Wave 1 hardcoded hint as fallback (see resolveNextBestAction). */
export function useNextBestAction(id: string | null): { result: NextBestActionResult | null; isLoading: boolean } {
  const { data, isLoading } = useSWR<NextBestActionResult>(
    id ? `${BUYER_PROFILES_KEY}/${id}/next-best-action` : null,
    fetcher,
  );
  return { result: data ?? null, isLoading: isLoading && data === undefined };
}

export interface BuyerNbaRule {
  id: string;
  label: string;
  priority: number;
  conditions: Condition[];
  suggestion: string;
  enabled: boolean;
}

const BUYER_NBA_RULES_KEY = "/api/buyer-nba-rules";

/** Wave 2 — every tenant-configured NBA rule, lowest priority number evaluated first. */
export function useBuyerNbaRules(): { rules: BuyerNbaRule[]; isLoading: boolean } {
  const { data, isLoading } = useSWR<{ rules: BuyerNbaRule[] }>(BUYER_NBA_RULES_KEY, fetcher);
  return { rules: data?.rules ?? [], isLoading: isLoading && data === undefined };
}

export async function createBuyerNbaRule(rule: Omit<BuyerNbaRule, "id">): Promise<boolean> {
  const res = await fetch(BUYER_NBA_RULES_KEY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rule),
  });
  globalMutate(BUYER_NBA_RULES_KEY);
  return res.ok;
}

export async function updateBuyerNbaRule(id: string, patch: Partial<Omit<BuyerNbaRule, "id">>): Promise<boolean> {
  const res = await fetch(`${BUYER_NBA_RULES_KEY}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  globalMutate(BUYER_NBA_RULES_KEY);
  return res.ok;
}

export async function deleteBuyerNbaRule(id: string): Promise<boolean> {
  const res = await fetch(`${BUYER_NBA_RULES_KEY}/${id}`, { method: "DELETE" });
  globalMutate(BUYER_NBA_RULES_KEY);
  return res.ok;
}

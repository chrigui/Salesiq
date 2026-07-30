"use client";

import useSWR, { mutate as globalMutate } from "swr";

/**
 * Captured leads — Module 3 "Lead Management". Real DB-backed store now
 * (src/app/api/leads/*.ts) — this is the client seam. `Lead` and
 * `useLeads()` keep their exact shapes from the localStorage era, so the
 * 9 components that only ever read leads needed zero changes; the 3 that
 * mutate (ProposalSheet's "Save lead to CRM", LeadManagement's status/
 * assign/follow-up controls, SecurityCompliance's GDPR redact) each needed
 * only their own async handling.
 *
 * Create happens on the companion (a live session becomes a lead, even
 * unauthenticated — see the SECURITY comment on POST /api/leads);
 * Edit/Assign/Follow-up/Status are managed from the dashboard.
 */
export type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost";

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "won",
  "lost",
];

export interface Lead {
  id: string;
  createdAt: number;
  name: string;
  phone: string;
  email: string;
  notes: string;
  packId: string;
  packLabel: string;
  itemName: string;
  price: number;
  currency: string;
  score: number;
  status: LeadStatus;
  /** User id from core/data/users, or null if unassigned. */
  assignedTo: string | null;
  /** Timestamp of the next scheduled follow-up, or null. */
  followUpAt: number | null;
}

const LEADS_KEY = "/api/leads";
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/** Live-updating list of captured leads, shared/deduped across every consumer via SWR's cache. */
export function useLeads(): Lead[] {
  const { data } = useSWR<{ leads: Lead[] }>(LEADS_KEY, fetcher);
  return data?.leads ?? [];
}

/** Same as useLeads(), but exposes loading state — use where an empty
 * array during the initial fetch would otherwise flash a false "no leads
 * yet" empty state. */
export function useLeadsState(): { leads: Lead[]; isLoading: boolean } {
  const { data, isLoading } = useSWR<{ leads: Lead[] }>(LEADS_KEY, fetcher);
  return { leads: data?.leads ?? [], isLoading: isLoading && data === undefined };
}

export async function saveLead(
  input: Omit<Lead, "id" | "createdAt" | "status" | "assignedTo" | "followUpAt">,
): Promise<Lead | null> {
  const res = await fetch(LEADS_KEY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) return null;
  const { lead } = await res.json();
  globalMutate(LEADS_KEY);
  return lead as Lead;
}

export async function updateLead(id: string, patch: Partial<Lead>): Promise<void> {
  await fetch(`${LEADS_KEY}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  globalMutate(LEADS_KEY);
}

/**
 * GDPR "right to be forgotten" (Module 10). Strips a lead's personal
 * fields (name, phone, email, notes) while keeping the analytics-relevant
 * shape (score, price, status, pack) intact, so aggregate reporting still
 * reflects that a session happened without retaining who it was.
 */
export async function redactLeadPII(id: string): Promise<void> {
  await fetch(`${LEADS_KEY}/${id}/redact`, { method: "POST" });
  globalMutate(LEADS_KEY);
}

"use client";

import { useEffect, useState } from "react";

/**
 * Captured leads. Persisted to localStorage so a session run on the companion
 * shows up live in the Company Dashboard (same browser) — closing the loop for
 * a demo with zero backend. In production this becomes a write to the tenant's
 * CRM / a KV store; the shape stays the same.
 *
 * Module 3 "Lead Management": Create happens on the companion (a live session
 * becomes a lead); Edit/Assign/Follow-up/Status are managed from the
 * dashboard, where a manager triages the pipeline — see LeadManagement.tsx.
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

const KEY = "salesiq-leads";
const EVT = "salesiq-leads-updated";

export function getLeads(): Lead[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]") as Partial<Lead>[];
    // Merge over defaults so leads captured before this feature still work.
    return raw.map((l) => ({
      status: "new",
      assignedTo: null,
      followUpAt: null,
      ...l,
    })) as Lead[];
  } catch {
    return [];
  }
}

function saveAll(leads: Lead[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(leads));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* storage unavailable */
  }
}

export function saveLead(
  input: Omit<Lead, "id" | "createdAt" | "status" | "assignedTo" | "followUpAt">,
): Lead {
  const lead: Lead = {
    ...input,
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()),
    createdAt: Date.now(),
    status: "new",
    assignedTo: null,
    followUpAt: null,
  };
  saveAll([lead, ...getLeads()].slice(0, 50));
  return lead;
}

export function updateLead(id: string, patch: Partial<Lead>): void {
  saveAll(getLeads().map((l) => (l.id === id ? { ...l, ...patch } : l)));
}

/** Live-updating list of captured leads (reacts across tabs and in-tab). */
export function useLeads(): Lead[] {
  const [leads, setLeads] = useState<Lead[]>([]);
  useEffect(() => {
    const load = () => setLeads(getLeads());
    load();
    window.addEventListener("storage", load);
    window.addEventListener(EVT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(EVT, load);
    };
  }, []);
  return leads;
}

"use client";

import { useEffect, useState } from "react";

/**
 * Captured leads. Persisted to localStorage so a session run on the companion
 * shows up live in the Company Dashboard (same browser) — closing the loop for
 * a demo with zero backend. In production this becomes a write to the tenant's
 * CRM / a KV store; the shape stays the same.
 */
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
}

const KEY = "salesiq-leads";
const EVT = "salesiq-leads-updated";

export function getLeads(): Lead[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as Lead[];
  } catch {
    return [];
  }
}

export function saveLead(input: Omit<Lead, "id" | "createdAt">): Lead {
  const lead: Lead = {
    ...input,
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()),
    createdAt: Date.now(),
  };
  const all = [lead, ...getLeads()].slice(0, 50);
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* storage unavailable */
  }
  return lead;
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

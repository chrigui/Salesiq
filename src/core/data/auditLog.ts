"use client";

import { useEffect, useState } from "react";

/**
 * Audit Logs (Module 5 · Platform Admin) — "everything is logged."
 *
 * A real, event-driven log, not a mockup feed: entries are written at the
 * exact moment a platform-admin action happens elsewhere in this module —
 * a feature flag flipped, a tenant's plan changed, a coupon created or
 * removed — via `logAudit()`, called from those call sites. Same
 * localStorage + event pattern as every other Platform Foundation resource.
 */
export interface AuditEntry {
  id: string;
  ts: number;
  actor: string;
  action: string;
  target: string;
  detail: string;
}

const KEY = "salesiq-audit-log";
const EVT = "salesiq-audit-log-updated";
const MAX_ENTRIES = 200;

const SEED: AuditEntry[] = [
  {
    id: "audit-seed-1",
    ts: Date.now() - 1000 * 60 * 60 * 26,
    actor: "Platform Admin",
    action: "Platform deployed",
    target: "SalesIQ",
    detail: "Initial platform admin console came online.",
  },
];

export function getAuditLog(): AuditEntry[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return SEED;
    return JSON.parse(raw) as AuditEntry[];
  } catch {
    return SEED;
  }
}

function saveAll(entries: AuditEntry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* storage unavailable */
  }
}

export function logAudit(input: { action: string; target: string; detail: string }): void {
  if (typeof window === "undefined") return;
  const entry: AuditEntry = {
    ...input,
    id: `audit-${Math.random().toString(36).slice(2, 9)}`,
    ts: Date.now(),
    actor: "Platform Admin",
  };
  saveAll([entry, ...getAuditLog()].slice(0, MAX_ENTRIES));
}

/** Live audit log — reacts to edits across tabs and in-tab. */
export function useAuditLog(): AuditEntry[] {
  const [entries, setEntries] = useState<AuditEntry[]>(SEED);
  useEffect(() => {
    const load = () => setEntries(getAuditLog());
    load();
    window.addEventListener("storage", load);
    window.addEventListener(EVT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(EVT, load);
    };
  }, []);
  return entries;
}

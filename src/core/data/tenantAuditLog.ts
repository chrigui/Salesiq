"use client";

import { useEffect, useState } from "react";

/**
 * Audit Trails (Module 10 · Enterprise Features) — tenant-scoped version of
 * the Platform Admin audit log (Module 5). A real, event-driven record of
 * account-level actions taken in this tenant's own dashboard: a user
 * invited or removed, a permission changed, a branch added, a plan
 * changed. Written at the exact call site of each action via logTenantAudit()
 * — not a mockup feed.
 */
export interface TenantAuditEntry {
  id: string;
  ts: number;
  actor: string;
  action: string;
  target: string;
  detail: string;
}

const KEY = "salesiq-tenant-audit-log";
const EVT = "salesiq-tenant-audit-log-updated";
const MAX_ENTRIES = 200;

export function getTenantAuditLog(): TenantAuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as TenantAuditEntry[];
  } catch {
    return [];
  }
}

function saveAll(entries: TenantAuditEntry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* storage unavailable */
  }
}

export function logTenantAudit(input: { actor: string; action: string; target: string; detail: string }): void {
  if (typeof window === "undefined") return;
  const entry: TenantAuditEntry = {
    ...input,
    id: `tenant-audit-${Math.random().toString(36).slice(2, 9)}`,
    ts: Date.now(),
  };
  saveAll([entry, ...getTenantAuditLog()].slice(0, MAX_ENTRIES));
}

/** Live tenant audit log — reacts to edits across tabs and in-tab. */
export function useTenantAuditLog(): TenantAuditEntry[] {
  const [entries, setEntries] = useState<TenantAuditEntry[]>([]);
  useEffect(() => {
    const load = () => setEntries(getTenantAuditLog());
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

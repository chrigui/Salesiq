"use client";

import { logTenantAudit } from "./tenantAuditLog";

/**
 * Backup Management & GDPR Data Export (Module 10 · Enterprise Features).
 *
 * A real, working local backup — every `salesiq-*` key this tenant's
 * browser has written (organization, users, branches, leads, knowledge
 * base, custom packs, drafts, notifications, settings…) is bundled into one
 * JSON file and downloaded. Restore reverses it. This is genuinely
 * functional, just honestly scoped: it backs up *this browser's* local
 * data, not a server-side, cross-device, multi-region backup — there's no
 * backend to hold one in this pilot.
 */
const PREFIX = "salesiq-";

function collectAll(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(PREFIX)) continue;
    try {
      out[key] = JSON.parse(localStorage.getItem(key) as string);
    } catch {
      out[key] = localStorage.getItem(key);
    }
  }
  return out;
}

export function downloadBackup(actor: string): void {
  const data = {
    exportedAt: new Date().toISOString(),
    scope: "browser-local",
    data: collectAll(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `salesiq-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  logTenantAudit({ actor, action: "Exported backup", target: "All tenant data", detail: `${Object.keys(data.data).length} keys` });
}

export async function restoreBackup(file: File, actor: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text) as { data?: Record<string, unknown> };
    if (!parsed.data || typeof parsed.data !== "object") {
      return { ok: false, error: "That file doesn't look like a SalesIQ backup." };
    }
    let restored = 0;
    for (const [key, value] of Object.entries(parsed.data)) {
      if (!key.startsWith(PREFIX)) continue;
      localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
      restored++;
    }
    logTenantAudit({ actor, action: "Restored backup", target: file.name, detail: `${restored} keys restored` });
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't read that file — is it a valid backup JSON?" };
  }
}

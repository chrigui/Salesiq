"use client";

import { logTenantAudit } from "./tenantAuditLog";

/**
 * Backup Management & GDPR Data Export (Module 10 · Enterprise Features).
 *
 * A real, working local backup of every `salesiq-*` key this tenant's
 * browser still has written directly (organization, branches, knowledge
 * base, custom packs, drafts, notifications, settings…), bundled into one
 * JSON file and downloaded; restore reverses it.
 *
 * Users, leads and sessions moved to Postgres (see src/lib/db.ts and
 * src/app/api/{users,leads,auth}/*.ts) and are deliberately NOT included
 * here anymore — a real cross-device backup would need a server-side
 * export endpoint, which is the natural next step once more stores make
 * the same move. Until then this covers what's genuinely still
 * browser-local, not the whole tenant.
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
    scope: "browser-local-settings",
    data: collectAll(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `salesiq-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  logTenantAudit({ actor, action: "Exported backup", target: "Browser-local settings", detail: `${Object.keys(data.data).length} keys — users/leads/sessions live in Postgres, not included` });
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

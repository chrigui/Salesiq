"use client";

import useSWR from "swr";
import type { UserRole } from "./users";
import { ROLES } from "./users";

/**
 * Role & Permission Engine — Module 1 · Platform Foundation.
 *
 * Real DB-backed store now (src/app/api/permissions/route.ts), enforced
 * server-side too (src/lib/auth/server.ts's serverCan/requireCapability) —
 * this used to be a client-only affordance. `can()` is still called
 * synchronously during render (the dashboard's nav-filtering useMemo), so
 * it can't become async: it reads a module-level cache seeded with the
 * same defaults the server seeds, refreshed as a side effect whenever
 * usePermissionMatrix() gets a fresh fetch. First paint uses the same
 * defaults the DB is seeded with, so there's no visible flicker.
 */
export interface Capability {
  id: string;
  label: string;
  group: string;
}

export const CAPABILITIES: Capability[] = [
  { id: "inventory.view", label: "View inventory", group: "Inventory" },
  { id: "inventory.edit", label: "Edit inventory", group: "Inventory" },
  { id: "inventory.delete", label: "Delete inventory", group: "Inventory" },
  { id: "questions.edit", label: "Edit questions", group: "Question flow" },
  { id: "scoring.edit", label: "Edit scoring rules", group: "Question flow" },
  { id: "branding.edit", label: "Edit branding", group: "Branding" },
  { id: "ai.manage", label: "Manage AI settings", group: "AI" },
  { id: "packs.create", label: "Create industry packs", group: "AI" },
  { id: "leads.view", label: "View leads", group: "Leads & CRM" },
  { id: "leads.edit", label: "Edit leads", group: "Leads & CRM" },
  { id: "leads.export", label: "Export reports", group: "Leads & CRM" },
  { id: "analytics.view", label: "View analytics", group: "Leads & CRM" },
  { id: "branches.manage", label: "Manage branches", group: "Organization" },
  { id: "users.manage", label: "Manage users", group: "Organization" },
  { id: "billing.manage", label: "Manage billing", group: "Organization" },
  { id: "security.manage", label: "Manage security & compliance", group: "Organization" },
];

export type PermissionMatrix = Record<UserRole, Record<string, boolean>>;

export function defaultMatrix(): PermissionMatrix {
  const grant = (ids: string[]): Record<string, boolean> =>
    Object.fromEntries(CAPABILITIES.map((c) => [c.id, ids.includes(c.id)]));

  const all = CAPABILITIES.map((c) => c.id);
  const managerSet = all.filter(
    (id) => !["billing.manage", "users.manage", "branches.manage", "security.manage"].includes(id),
  );
  const salesSet = ["inventory.view", "questions.edit", "leads.view", "leads.edit", "analytics.view"];
  const viewerSet = ["inventory.view", "leads.view", "analytics.view"];

  return {
    Owner: grant(all),
    Admin: grant(all),
    Manager: grant(managerSet),
    Salesperson: grant(salesSet),
    Viewer: grant(viewerSet),
  };
}

const PERMISSIONS_KEY = "/api/permissions";
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// The synchronous read path — can() must stay sync (see file doc comment),
// so this cache is the seam between the async DB fetch and that sync call.
let cachedMatrix: PermissionMatrix = defaultMatrix();

/** Whether a role holds a capability — the check every surface calls, sync. */
export function can(role: UserRole, capabilityId: string): boolean {
  if (role === "Owner") return true; // no-lockout guarantee, mirrors the server check
  return cachedMatrix[role]?.[capabilityId] ?? false;
}

/** Live permission matrix — reacts to edits across tabs and in-tab via SWR, and refreshes the sync cache can() reads. */
export function usePermissionMatrix(): PermissionMatrix {
  const { data } = useSWR<{ matrix: Record<string, Record<string, boolean>> }>(PERMISSIONS_KEY, fetcher, {
    onSuccess: (result) => {
      const fallback = defaultMatrix();
      const merged = {} as PermissionMatrix;
      for (const role of ROLES) {
        merged[role] = { ...fallback[role], ...result.matrix[role] };
      }
      merged.Owner = fallback.Owner;
      cachedMatrix = merged;
    },
  });

  if (!data) return cachedMatrix;
  const fallback = defaultMatrix();
  const merged = {} as PermissionMatrix;
  for (const role of ROLES) {
    merged[role] = { ...fallback[role], ...data.matrix[role] };
  }
  merged.Owner = fallback.Owner;
  return merged;
}

export async function savePermissionMatrix(matrix: PermissionMatrix): Promise<void> {
  await fetch(PERMISSIONS_KEY, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(matrix),
  });
  cachedMatrix = matrix;
}

export async function resetPermissionMatrix(): Promise<void> {
  await savePermissionMatrix(defaultMatrix());
}

/** Non-hook accessor for the current best-known matrix (used by editors that need a synchronous read-modify-write). */
export function getPermissionMatrix(): PermissionMatrix {
  return cachedMatrix;
}

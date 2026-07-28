"use client";

import { useEffect, useState } from "react";
import type { UserRole } from "./users";
import { ROLES } from "./users";

/**
 * Role & Permission Engine — Module 1 · Platform Foundation.
 *
 * Every capability in the product is declared once here, grouped by the
 * resource it governs. A permission matrix (role x capability -> boolean) is
 * the tenant's actual access-control policy; Owner is always fully granted
 * and cannot be edited (there must always be one role with full access).
 * `can()` is the seam every surface will eventually call before rendering an
 * action or handling a request — today only the dashboard consults it, but
 * the shape is what a server-side check would use unchanged.
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
  { id: "leads.export", label: "Export reports", group: "Leads & CRM" },
  { id: "analytics.view", label: "View analytics", group: "Leads & CRM" },
  { id: "branches.manage", label: "Manage branches", group: "Organization" },
  { id: "users.manage", label: "Manage users", group: "Organization" },
  { id: "billing.manage", label: "Manage billing", group: "Organization" },
];

export type PermissionMatrix = Record<UserRole, Record<string, boolean>>;

function defaultMatrix(): PermissionMatrix {
  const grant = (ids: string[]): Record<string, boolean> =>
    Object.fromEntries(CAPABILITIES.map((c) => [c.id, ids.includes(c.id)]));

  const all = CAPABILITIES.map((c) => c.id);
  const managerSet = all.filter((id) => !["billing.manage", "users.manage", "branches.manage"].includes(id));
  const salesSet = [
    "inventory.view",
    "questions.edit",
    "leads.view",
    "analytics.view",
  ];
  const viewerSet = ["inventory.view", "leads.view", "analytics.view"];

  return {
    Owner: grant(all),
    Admin: grant(all),
    Manager: grant(managerSet),
    Salesperson: grant(salesSet),
    Viewer: grant(viewerSet),
  };
}

const KEY = "salesiq-permissions";
const EVT = "salesiq-permissions-updated";

export function getPermissionMatrix(): PermissionMatrix {
  const fallback = defaultMatrix();
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as PermissionMatrix;
    // Merge over defaults so newly-added capabilities are always present.
    const merged = {} as PermissionMatrix;
    for (const role of ROLES) {
      merged[role] = { ...fallback[role], ...parsed[role] };
    }
    // Owner is always fully granted — it is the non-lockout guarantee.
    merged.Owner = fallback.Owner;
    return merged;
  } catch {
    return fallback;
  }
}

export function savePermissionMatrix(matrix: PermissionMatrix): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...matrix, Owner: defaultMatrix().Owner }));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* storage unavailable */
  }
}

export function resetPermissionMatrix(): void {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* storage unavailable */
  }
}

/** Whether a role holds a capability — the check every surface calls. */
export function can(role: UserRole, capabilityId: string): boolean {
  return getPermissionMatrix()[role]?.[capabilityId] ?? false;
}

/** Live permission matrix — reacts to edits across tabs and in-tab. */
export function usePermissionMatrix(): PermissionMatrix {
  const [matrix, setMatrix] = useState<PermissionMatrix>(defaultMatrix());
  useEffect(() => {
    const load = () => setMatrix(getPermissionMatrix());
    load();
    window.addEventListener("storage", load);
    window.addEventListener(EVT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(EVT, load);
    };
  }, []);
  return matrix;
}

"use client";

import { useEffect, useState } from "react";
import { logAudit } from "./auditLog";

/**
 * Tenant Management (Module 5 · Platform Admin) — stateful version of the
 * platform's tenant list. Seeded with the same illustrative tenants the
 * admin console has always shown; promoted to a real localStorage-backed
 * store so the Subscriptions tab can actually change a tenant's plan
 * (rather than just displaying a static array), with the change reflected
 * everywhere the tenant list is read and logged to the audit trail.
 */
export type TenantHealth = "healthy" | "watch" | "at-risk";
export type PlatformPlan = "Starter" | "Growth" | "Enterprise";

export const PLATFORM_PLANS: PlatformPlan[] = ["Starter", "Growth", "Enterprise"];

export interface PlatformTenant {
  id: string;
  name: string;
  vertical: string;
  plan: PlatformPlan;
  seats: number;
  sessions: number;
  mrr: number;
  health: TenantHealth;
}

const SEED: PlatformTenant[] = [
  { id: "green-hills-living", name: "Green Hills Living", vertical: "Real Estate", plan: "Enterprise", seats: 48, sessions: 1840, mrr: 4200, health: "healthy" },
  { id: "vantage-motors", name: "Vantage Motors", vertical: "Automotive", plan: "Growth", seats: 22, sessions: 962, mrr: 1800, health: "healthy" },
  { id: "meridian-aviation", name: "Meridian Aviation", vertical: "Private Jets", plan: "Enterprise", seats: 12, sessions: 214, mrr: 6900, health: "healthy" },
  { id: "helix-medical", name: "Helix Medical", vertical: "Medical Equipment", plan: "Growth", seats: 31, sessions: 733, mrr: 2100, health: "watch" },
  { id: "coastline-yachts", name: "Coastline Yachts", vertical: "Yachts", plan: "Starter", seats: 6, sessions: 98, mrr: 490, health: "at-risk" },
  { id: "assured-cover", name: "Assured Cover", vertical: "Insurance", plan: "Growth", seats: 40, sessions: 1512, mrr: 2400, health: "healthy" },
];

/** Rough per-seat pricing so a plan change moves MRR in a sensible direction. */
const PLAN_BASE_MRR: Record<PlatformPlan, number> = { Starter: 79, Growth: 60, Enterprise: 45 };
const PLAN_FLOOR: Record<PlatformPlan, number> = { Starter: 490, Growth: 1500, Enterprise: 4000 };

function estimateMrr(plan: PlatformPlan, seats: number): number {
  return Math.max(PLAN_FLOOR[plan], Math.round(seats * PLAN_BASE_MRR[plan]));
}

const KEY = "salesiq-platform-tenants";
const EVT = "salesiq-platform-tenants-updated";

export function getPlatformTenants(): PlatformTenant[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return SEED;
    return JSON.parse(raw) as PlatformTenant[];
  } catch {
    return SEED;
  }
}

function saveAll(tenants: PlatformTenant[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(tenants));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* storage unavailable */
  }
}

export function updateTenantPlan(id: string, plan: PlatformPlan): void {
  const tenants = getPlatformTenants();
  const tenant = tenants.find((t) => t.id === id);
  if (!tenant || tenant.plan === plan) return;
  const mrr = estimateMrr(plan, tenant.seats);
  saveAll(tenants.map((t) => (t.id === id ? { ...t, plan, mrr } : t)));
  logAudit({
    action: "Changed plan",
    target: tenant.name,
    detail: `${tenant.plan} → ${plan}`,
  });
}

/** Live tenant list — reacts to edits across tabs and in-tab. */
export function usePlatformTenants(): PlatformTenant[] {
  const [tenants, setTenants] = useState<PlatformTenant[]>(SEED);
  useEffect(() => {
    const load = () => setTenants(getPlatformTenants());
    load();
    window.addEventListener("storage", load);
    window.addEventListener(EVT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(EVT, load);
    };
  }, []);
  return tenants;
}

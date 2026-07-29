"use client";

import { useEffect, useState } from "react";
import { logAudit } from "./auditLog";

/**
 * Coupons (Module 5 · Platform Admin · Billing Center). The one genuinely
 * mutable piece of billing — invoices and payments are derived read-only
 * from the tenant list, but coupons are a real, persisted resource an
 * admin creates and retires, logged to the audit trail like every other
 * admin action in this module.
 */
export interface Coupon {
  id: string;
  code: string;
  discountPct: number;
  expiresAt: number | null;
  active: boolean;
  createdAt: number;
}

const DEFAULTS: Coupon[] = [
  {
    id: "coupon-launch25",
    code: "LAUNCH25",
    discountPct: 25,
    expiresAt: null,
    active: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
  },
];

const KEY = "salesiq-coupons";
const EVT = "salesiq-coupons-updated";

export function getCoupons(): Coupon[] {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return JSON.parse(raw) as Coupon[];
  } catch {
    return DEFAULTS;
  }
}

function saveAll(coupons: Coupon[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(coupons));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* storage unavailable */
  }
}

export function createCoupon(input: { code: string; discountPct: number; expiresAt: number | null }): Coupon {
  const coupon: Coupon = {
    ...input,
    code: input.code.toUpperCase(),
    id: `coupon-${Math.random().toString(36).slice(2, 8)}`,
    active: true,
    createdAt: Date.now(),
  };
  saveAll([coupon, ...getCoupons()]);
  logAudit({ action: "Created coupon", target: coupon.code, detail: `${coupon.discountPct}% off` });
  return coupon;
}

export function toggleCoupon(id: string): void {
  const coupons = getCoupons();
  const coupon = coupons.find((c) => c.id === id);
  if (!coupon) return;
  const active = !coupon.active;
  saveAll(coupons.map((c) => (c.id === id ? { ...c, active } : c)));
  logAudit({
    action: active ? "Reactivated coupon" : "Deactivated coupon",
    target: coupon.code,
    detail: active ? "Coupon usable again" : "Coupon can no longer be redeemed",
  });
}

export function deleteCoupon(id: string): void {
  const coupon = getCoupons().find((c) => c.id === id);
  saveAll(getCoupons().filter((c) => c.id !== id));
  if (coupon) logAudit({ action: "Deleted coupon", target: coupon.code, detail: "Removed permanently" });
}

/** Live coupon list — reacts to edits across tabs and in-tab. */
export function useCoupons(): Coupon[] {
  const [coupons, setCoupons] = useState<Coupon[]>(DEFAULTS);
  useEffect(() => {
    const load = () => setCoupons(getCoupons());
    load();
    window.addEventListener("storage", load);
    window.addEventListener(EVT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(EVT, load);
    };
  }, []);
  return coupons;
}

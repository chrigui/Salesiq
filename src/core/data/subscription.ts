"use client";

import { useEffect, useState } from "react";

/**
 * Subscription Management — Module 1 · Platform Foundation (final feature).
 *
 * Manages the tenant's plan, billing cycle and invoice history. Same
 * localStorage-backed seam as the rest of Platform Foundation; in production
 * this becomes a read from the billing provider (Stripe subscriptions +
 * invoices) with upgrade/downgrade/cancel calling their API instead of
 * writing local state directly.
 */
export type PlanId = "trial" | "monthly" | "annual" | "enterprise";
export type SubscriptionStatus = "trialing" | "active" | "canceled" | "past_due";

export interface PlanInfo {
  id: PlanId;
  name: string;
  price: number | null; // null = "Contact us" (enterprise)
  cadence: string;
  blurb: string;
  features: string[];
}

export const PLANS: PlanInfo[] = [
  {
    id: "trial",
    name: "Trial",
    price: 0,
    cadence: "14 days",
    blurb: "Full access, no card required.",
    features: ["1 branch", "Up to 3 users", "1 industry pack", "Community support"],
  },
  {
    id: "monthly",
    name: "Monthly",
    price: 249,
    cadence: "per month",
    blurb: "Flexible, cancel any time.",
    features: ["Up to 5 branches", "Up to 25 users", "All industry packs", "Email support"],
  },
  {
    id: "annual",
    name: "Annual",
    price: 199,
    cadence: "per month, billed yearly",
    blurb: "Two months free versus monthly.",
    features: ["Unlimited branches", "Up to 100 users", "All industry packs", "Priority support"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    cadence: "custom",
    blurb: "SSO, SLAs and a dedicated success manager.",
    features: ["Unlimited everything", "SSO / Active Directory", "Custom SLA", "Dedicated CSM"],
  },
];

export interface BillingEntry {
  id: string;
  date: number;
  description: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed";
}

export interface Subscription {
  plan: PlanId;
  status: SubscriptionStatus;
  seats: number;
  renewsAt: number | null;
  trialEndsAt: number | null;
  canceledAt: number | null;
  history: BillingEntry[];
}

const KEY = "salesiq-subscription";
const EVT = "salesiq-subscription-updated";
const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

function seedHistory(): BillingEntry[] {
  return [
    { id: "inv-2026-06", date: now - 30 * DAY, description: "Annual plan · Jun 2026", amount: 199, currency: "USD", status: "paid" },
    { id: "inv-2026-05", date: now - 60 * DAY, description: "Annual plan · May 2026", amount: 199, currency: "USD", status: "paid" },
    { id: "inv-2026-04", date: now - 90 * DAY, description: "Annual plan · Apr 2026", amount: 199, currency: "USD", status: "paid" },
    { id: "inv-2026-03", date: now - 120 * DAY, description: "Monthly plan · Mar 2026", amount: 249, currency: "USD", status: "paid" },
  ];
}

const DEFAULT_SUB: Subscription = {
  plan: "annual",
  status: "active",
  seats: 22,
  renewsAt: now + 235 * DAY,
  trialEndsAt: null,
  canceledAt: null,
  history: seedHistory(),
};

export function getSubscription(): Subscription {
  if (typeof window === "undefined") return DEFAULT_SUB;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SUB;
    return JSON.parse(raw) as Subscription;
  } catch {
    return DEFAULT_SUB;
  }
}

function save(sub: Subscription): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(sub));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* storage unavailable */
  }
}

/** Switch plan — used for both upgrade and downgrade (same operation). */
export function changePlan(plan: PlanId): void {
  const sub = getSubscription();
  const info = PLANS.find((p) => p.id === plan)!;
  const entry: BillingEntry = {
    id: `inv-${Date.now()}`,
    date: Date.now(),
    description: `Switched to ${info.name} plan`,
    amount: info.price ?? 0,
    currency: "USD",
    status: "paid",
  };
  save({
    ...sub,
    plan,
    status: plan === "trial" ? "trialing" : "active",
    trialEndsAt: plan === "trial" ? Date.now() + 14 * DAY : null,
    renewsAt: plan === "trial" ? null : Date.now() + (plan === "annual" ? 365 : 30) * DAY,
    canceledAt: null,
    history: [entry, ...sub.history],
  });
}

export function cancelSubscription(): void {
  const sub = getSubscription();
  save({ ...sub, status: "canceled", canceledAt: Date.now() });
}

export function reactivateSubscription(): void {
  const sub = getSubscription();
  save({ ...sub, status: "active", canceledAt: null, renewsAt: Date.now() + 30 * DAY });
}

/** Live subscription record — reacts to edits across tabs and in-tab. */
export function useSubscription(): Subscription {
  const [sub, setSub] = useState<Subscription>(DEFAULT_SUB);
  useEffect(() => {
    const load = () => setSub(getSubscription());
    load();
    window.addEventListener("storage", load);
    window.addEventListener(EVT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(EVT, load);
    };
  }, []);
  return sub;
}

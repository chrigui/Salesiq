"use client";

import { useEffect, useState } from "react";
import { logAudit } from "./auditLog";

/**
 * Feature Flags (Module 5 · Platform Admin). Real capabilities already
 * shipping in SalesIQ, toggleable platform-wide — enable/disable, mark
 * beta. Flipping one writes a real audit-log entry, same as every other
 * admin action in this module.
 */
export interface FeatureFlag {
  id: string;
  label: string;
  description: string;
  beta: boolean;
  enabled: boolean;
}

const DEFAULTS: FeatureFlag[] = [
  {
    id: "smart-wizard",
    label: "Smart Wizard",
    description: "Generates a full working dashboard — questions, inventory, scoring rules — from a one-line business description.",
    beta: true,
    enabled: true,
  },
  {
    id: "objection-handler",
    label: "Objection Handler",
    description: "AI-composed responses to customer objections, grounded in verified facts, from the companion.",
    beta: true,
    enabled: true,
  },
  {
    id: "custom-industry-packs",
    label: "Custom Industry Packs",
    description: "Lets a tenant create their own industry pack — questions, inventory, branding — without code.",
    beta: false,
    enabled: true,
  },
  {
    id: "notification-center",
    label: "Notification Center",
    description: "A live feed of what's happening — new leads, deals won, and anything else that needs a tenant's attention.",
    beta: false,
    enabled: true,
  },
  {
    id: "webhook-integrations",
    label: "Webhook Integrations",
    description: "The moment a lead is saved, push it straight into whatever a tenant already runs on — no manual export, no polling.",
    beta: true,
    enabled: true,
  },
  {
    id: "mqtt-sync",
    label: "Live Cross-Device Sync",
    description: "Keeps the salesperson's phone and the customer's screen moving together in real time, down to the second.",
    beta: false,
    enabled: true,
  },
];

const KEY = "salesiq-feature-flags";
const EVT = "salesiq-feature-flags-updated";

export function getFeatureFlags(): FeatureFlag[] {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const stored = JSON.parse(raw) as FeatureFlag[];
    // Merge over defaults so a flag shipped after a tenant's first visit
    // still shows up, defaulting to its shipped state.
    const byId = new Map(stored.map((f) => [f.id, f]));
    return DEFAULTS.map((d) => byId.get(d.id) ?? d);
  } catch {
    return DEFAULTS;
  }
}

function saveAll(flags: FeatureFlag[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(flags));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* storage unavailable */
  }
}

export function toggleFlag(id: string): void {
  const flags = getFeatureFlags();
  const flag = flags.find((f) => f.id === id);
  if (!flag) return;
  const nextEnabled = !flag.enabled;
  saveAll(flags.map((f) => (f.id === id ? { ...f, enabled: nextEnabled } : f)));
  logAudit({
    action: nextEnabled ? "Enabled feature flag" : "Disabled feature flag",
    target: flag.label,
    detail: nextEnabled ? "Turned on platform-wide" : "Turned off platform-wide",
  });
}

/** Live feature flags — reacts to edits across tabs and in-tab. */
export function useFeatureFlags(): FeatureFlag[] {
  const [flags, setFlags] = useState<FeatureFlag[]>(DEFAULTS);
  useEffect(() => {
    const load = () => setFlags(getFeatureFlags());
    load();
    window.addEventListener("storage", load);
    window.addEventListener(EVT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(EVT, load);
    };
  }, []);
  return flags;
}

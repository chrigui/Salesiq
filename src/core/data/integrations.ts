"use client";

import { useEffect, useState } from "react";
import { notify } from "./notifications";

/**
 * Integrations (Module 4 · Company Dashboard).
 *
 * A pilot-scoped integration layer: a genuinely functional outbound webhook
 * (fired client-side, since there's no backend to hold real OAuth
 * connections) alongside the Email/WhatsApp delivery channels the product
 * already ships (Proposal Writer, Email Generator, and the mailto:/wa.me
 * links in ProposalSheet). Calendar/CRM/SMS sync would need a real backend
 * and third-party OAuth this pilot doesn't have — shown as not connected
 * rather than faked, matching the honesty of the Auth module's disclosure.
 */
export interface IntegrationSettings {
  webhookUrl: string;
  webhookEnabled: boolean;
  lastFiredAt: number | null;
  lastEvent: string | null;
  lastStatus: "ok" | "error" | null;
}

const DEFAULTS: IntegrationSettings = {
  webhookUrl: "",
  webhookEnabled: false,
  lastFiredAt: null,
  lastEvent: null,
  lastStatus: null,
};

const KEY = "salesiq-integrations";
const EVT = "salesiq-integrations-updated";

export function getIntegrationSettings(): IntegrationSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<IntegrationSettings>) };
  } catch {
    return DEFAULTS;
  }
}

export function saveIntegrationSettings(patch: Partial<IntegrationSettings>): void {
  try {
    const next = { ...getIntegrationSettings(), ...patch };
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* storage unavailable */
  }
}

/** Live integration settings — reacts to edits across tabs and in-tab. */
export function useIntegrationSettings(): IntegrationSettings {
  const [settings, setSettings] = useState<IntegrationSettings>(DEFAULTS);
  useEffect(() => {
    const load = () => setSettings(getIntegrationSettings());
    load();
    window.addEventListener("storage", load);
    window.addEventListener(EVT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(EVT, load);
    };
  }, []);
  return settings;
}

/**
 * Fires the configured webhook with a JSON payload, if enabled and a URL is
 * set. A real (not simulated) POST from the browser — no backend involved,
 * so it only works for URLs that accept cross-origin requests (most webhook
 * receivers — Zapier, Make, a tenant's own endpoint — do). Silently records
 * success/failure rather than surfacing a toast, since it fires from
 * background actions like saving a lead.
 */
export async function fireWebhook(event: string, payload: unknown): Promise<void> {
  const settings = getIntegrationSettings();
  if (!settings.webhookEnabled || !settings.webhookUrl) return;
  try {
    await fetch(settings.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, firedAt: Date.now(), payload }),
    });
    saveIntegrationSettings({ lastFiredAt: Date.now(), lastEvent: event, lastStatus: "ok" });
  } catch {
    saveIntegrationSettings({ lastFiredAt: Date.now(), lastEvent: event, lastStatus: "error" });
    notify({
      kind: "system",
      title: "Webhook delivery failed",
      detail: `"${event}" couldn't reach ${settings.webhookUrl}.`,
    });
  }
}

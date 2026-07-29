"use client";

import { useEffect, useState } from "react";
import { logTenantAudit } from "./tenantAuditLog";

/**
 * Single Sign-On (Module 10 · Enterprise Features).
 *
 * A real, persisted configuration surface — not wired to an actual identity
 * provider, since that needs a registered app with a real Azure AD/Okta/SAML
 * tenant this pilot doesn't have. Settings persist and every change is
 * audited; the login screen surfaces a banner when SSO is marked required so
 * the UI is honest about what's configured, but the demo password path is
 * deliberately left open rather than locking out the pilot.
 */
export type SsoProvider = "none" | "azure-ad" | "okta" | "saml";

export interface SsoSettings {
  provider: SsoProvider;
  metadataUrl: string;
  clientId: string;
  enforced: boolean;
}

export const SSO_PROVIDERS: { id: SsoProvider; label: string }[] = [
  { id: "none", label: "Not configured" },
  { id: "azure-ad", label: "Azure AD / Entra ID" },
  { id: "okta", label: "Okta" },
  { id: "saml", label: "Generic SAML 2.0" },
];

const DEFAULTS: SsoSettings = { provider: "none", metadataUrl: "", clientId: "", enforced: false };
const KEY = "salesiq-sso-settings";
const EVT = "salesiq-sso-settings-updated";

export function getSsoSettings(): SsoSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<SsoSettings>) };
  } catch {
    return DEFAULTS;
  }
}

export function saveSsoSettings(patch: Partial<SsoSettings>, actor: string): void {
  try {
    const next = { ...getSsoSettings(), ...patch };
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVT));
    logTenantAudit({
      actor,
      action: "Updated SSO settings",
      target: SSO_PROVIDERS.find((p) => p.id === next.provider)?.label ?? next.provider,
      detail: next.enforced ? "SSO required for sign-in" : "SSO optional",
    });
  } catch {
    /* storage unavailable */
  }
}

export function useSsoSettings(): SsoSettings {
  const [settings, setSettings] = useState<SsoSettings>(DEFAULTS);
  useEffect(() => {
    const load = () => setSettings(getSsoSettings());
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

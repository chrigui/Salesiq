"use client";

import { useEffect, useState } from "react";

/**
 * Organization (tenant) record — Module 1 · Platform Foundation.
 *
 * This is the top-level tenant object every other resource hangs off. For the
 * pilot it persists to localStorage behind a small API, exactly like leads and
 * pack drafts; the shape is the seam. In production `getOrganization` /
 * `saveOrganization` become reads/writes against the tenant row in Postgres (or
 * Vercel KV) — callers and the UI do not change.
 */
export interface WorkingHours {
  /** Weekday keys that are open, e.g. ["Mon","Tue",...]. */
  days: string[];
  open: string; // "09:00"
  close: string; // "18:00"
}

export interface Organization {
  name: string;
  legalName: string;
  logoGlyph: string;
  logoUrl: string;
  tagline: string;
  defaultLanguage: string;
  defaultCurrency: string;
  timezone: string;
  address: string;
  workingHours: WorkingHours;
  businessUnits: string[];
}

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "ar", label: "العربية" },
  { code: "el", label: "Ελληνικά" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
];

export const CURRENCIES = ["USD", "EUR", "GBP", "AED", "CHF", "SAR", "CAD", "AUD"];

export const TIMEZONES = [
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Athens",
  "Asia/Nicosia",
  "Asia/Dubai",
  "Asia/Riyadh",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Singapore",
];

const KEY = "salesiq-organization";
const EVT = "salesiq-org-updated";

const DEFAULT_ORG: Organization = {
  name: "Green Hills Living",
  legalName: "Green Hills Living Ltd.",
  logoGlyph: "◈",
  logoUrl: "",
  tagline: "Find the home your life is asking for.",
  defaultLanguage: "en",
  defaultCurrency: "USD",
  timezone: "Asia/Nicosia",
  address: "Larnaca, Cyprus",
  workingHours: { days: ["Mon", "Tue", "Wed", "Thu", "Fri"], open: "09:00", close: "18:00" },
  businessUnits: ["Residential Sales", "Investment"],
};

export function getOrganization(): Organization {
  if (typeof window === "undefined") return DEFAULT_ORG;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_ORG;
    // Merge over defaults so newly-added fields are always present.
    const parsed = JSON.parse(raw) as Partial<Organization>;
    return {
      ...DEFAULT_ORG,
      ...parsed,
      workingHours: { ...DEFAULT_ORG.workingHours, ...parsed.workingHours },
      businessUnits: parsed.businessUnits ?? DEFAULT_ORG.businessUnits,
    };
  } catch {
    return DEFAULT_ORG;
  }
}

export function saveOrganization(org: Organization): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(org));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* storage unavailable */
  }
}

/** Live organization record — reacts to edits across tabs and in-tab. */
export function useOrganization(): Organization {
  const [org, setOrg] = useState<Organization>(DEFAULT_ORG);
  useEffect(() => {
    const load = () => setOrg(getOrganization());
    load();
    window.addEventListener("storage", load);
    window.addEventListener(EVT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(EVT, load);
    };
  }, []);
  return org;
}

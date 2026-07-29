"use client";

import { useEffect, useState } from "react";
import { logAudit } from "./auditLog";

/** Billing Center (Module 5) — the platform's own tax rate, applied to every invoice. */
const KEY = "salesiq-billing-settings";
const EVT = "salesiq-billing-settings-updated";
const DEFAULT_TAX_PCT = 8.5;

export function getTaxRate(): number {
  if (typeof window === "undefined") return DEFAULT_TAX_PCT;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? Number(JSON.parse(raw).taxPct) : DEFAULT_TAX_PCT;
  } catch {
    return DEFAULT_TAX_PCT;
  }
}

export function saveTaxRate(taxPct: number): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ taxPct }));
    window.dispatchEvent(new CustomEvent(EVT));
    logAudit({ action: "Updated tax rate", target: "Billing settings", detail: `Set to ${taxPct}%` });
  } catch {
    /* storage unavailable */
  }
}

export function useTaxRate(): number {
  const [rate, setRate] = useState<number>(DEFAULT_TAX_PCT);
  useEffect(() => {
    const load = () => setRate(getTaxRate());
    load();
    window.addEventListener("storage", load);
    window.addEventListener(EVT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(EVT, load);
    };
  }, []);
  return rate;
}

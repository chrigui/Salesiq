"use client";

import { useEffect, useState } from "react";
import {
  AI_SETTINGS_DEFAULTS,
  type AiSettingsShape,
} from "./aiSettingsShared";

/**
 * AI Settings (Module 4 · Company Dashboard) — client-side localStorage
 * layer. The pure types/defaults/prompt-directive helpers live in
 * aiSettingsShared.ts (server-safe, no "use client"); this file re-exports
 * them for existing client call sites and adds the browser-only bits:
 * persistence and the live `useAiSettings` hook.
 */
export type { AiTone, AiSettingsShape } from "./aiSettingsShared";
export { AI_TONES, AI_SETTINGS_DEFAULTS, resolveAiSettings, toneDirective, knowledgeOnlyDirective } from "./aiSettingsShared";

const KEY = "salesiq-ai-settings";
const EVT = "salesiq-ai-settings-updated";

export function getAiSettings(): AiSettingsShape {
  if (typeof window === "undefined") return AI_SETTINGS_DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return AI_SETTINGS_DEFAULTS;
    return { ...AI_SETTINGS_DEFAULTS, ...(JSON.parse(raw) as Partial<AiSettingsShape>) };
  } catch {
    return AI_SETTINGS_DEFAULTS;
  }
}

export function saveAiSettings(patch: Partial<AiSettingsShape>): void {
  try {
    const next = { ...getAiSettings(), ...patch };
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* storage unavailable */
  }
}

export function resetAiSettings(): void {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* storage unavailable */
  }
}

/** Live AI settings — reacts to edits across tabs and in-tab. */
export function useAiSettings(): AiSettingsShape {
  const [settings, setSettings] = useState<AiSettingsShape>(AI_SETTINGS_DEFAULTS);
  useEffect(() => {
    const load = () => setSettings(getAiSettings());
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

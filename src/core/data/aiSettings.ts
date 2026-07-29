"use client";

import { useEffect, useState } from "react";

/**
 * AI Settings (Module 4 · Company Dashboard). Tenant-level controls over how
 * every Claude-powered surface (Decision Engine narration, Proposal Writer,
 * Email Generator, Objection Handler) behaves when ANTHROPIC_API_KEY is set —
 * threaded through each /api/ai/* route's prompt and `temperature`, not just
 * cosmetic. The deterministic fallback paths are unaffected by design: there
 * is no model to tune when one isn't being called.
 */
export type AiTone = "warm" | "professional" | "concise" | "enthusiastic";

export interface AiSettingsShape {
  tone: AiTone;
  /** 0 (focused, low-variance) .. 1 (more creative). Maps to Claude's `temperature`. */
  creativity: number;
  /** When on, the prompt is told to use only the verified facts and Knowledge Base — nothing else. */
  knowledgeOnly: boolean;
  /** Caps how many Knowledge Base entries are sent to any single AI call. */
  maxKnowledgeFacts: number;
}

export const AI_TONES: { id: AiTone; label: string }[] = [
  { id: "warm", label: "Warm" },
  { id: "professional", label: "Professional" },
  { id: "concise", label: "Concise" },
  { id: "enthusiastic", label: "Enthusiastic" },
];

export const AI_SETTINGS_DEFAULTS: AiSettingsShape = {
  tone: "warm",
  creativity: 0.6,
  knowledgeOnly: false,
  maxKnowledgeFacts: 6,
};

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

/** Merge a partial settings payload (as received by an API route) over defaults. */
export function resolveAiSettings(partial: Partial<AiSettingsShape> | undefined): AiSettingsShape {
  return { ...AI_SETTINGS_DEFAULTS, ...(partial ?? {}) };
}

/** The tone directive line shared by every prompt builder. */
export function toneDirective(settings: AiSettingsShape): string {
  switch (settings.tone) {
    case "professional":
      return "Write in a professional, polished tone.";
    case "concise":
      return "Write concisely — short sentences, no filler.";
    case "enthusiastic":
      return "Write with genuine enthusiasm and energy.";
    case "warm":
    default:
      return "Write in a warm, personable tone.";
  }
}

/** The guardrail line shared by every prompt builder, only added when the tenant enabled it. */
export function knowledgeOnlyDirective(settings: AiSettingsShape): string | null {
  if (!settings.knowledgeOnly) return null;
  return "Strict guardrail: use ONLY the verified facts and company facts listed above — do not add any general knowledge, advice, or claims beyond them.";
}

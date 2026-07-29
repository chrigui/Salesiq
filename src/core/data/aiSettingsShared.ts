/**
 * The pure, server-safe half of AI Settings (Module 4). Deliberately NOT
 * marked "use client" — every export of a "use client" file becomes a
 * client-only reference under the Next.js App Router, even a pure function
 * with no browser API in it, and throws if a Route Handler calls it
 * directly. `aiSettings.ts` (client, localStorage-backed) re-exports these
 * for existing client call sites; every /api/ai/* route and every
 * core/engine/* prompt builder imports straight from here instead.
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

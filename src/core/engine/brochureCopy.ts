import type { InventoryItem, IndustryPack } from "@/core/types";
import { formatMoney } from "@/core/engine/explain";
import { toneDirective, knowledgeOnlyDirective, type AiSettingsShape } from "@/core/data/aiSettingsShared";

export interface BrochureCopy {
  summary: string;
  highlights: string[];
}

export interface BrochureCopyResult {
  en: BrochureCopy;
  /** Arabic translation of `en` — only ever populated by Claude (translation, not generation); left null when no AI key is configured. */
  ar: BrochureCopy | null;
}

/**
 * Deterministic brochure copy — a plain, honest summary assembled from the
 * item's own real fields, no invention. This is what ships when
 * ANTHROPIC_API_KEY isn't set, and what Claude is asked to *polish*
 * (never replace with invented facts) when it is.
 */
export function writeBrochureCopy(item: InventoryItem): BrochureCopy {
  const priceLine = formatMoney(item.price, item.currency);
  const summary = `${item.name} — ${item.subtitle}. Listed at ${priceLine}. ${item.highlights.join(". ")}.`;
  return { summary, highlights: item.highlights };
}

export function buildBrochureCopyPrompt(
  item: InventoryItem,
  pack: IndustryPack,
  settings: AiSettingsShape,
): string {
  const guardrail = knowledgeOnlyDirective(settings);
  return [
    `You are writing marketing copy for a ${pack.vertical} listing microsite.`,
    toneDirective(settings),
    "Use ONLY the facts listed below — never invent amenities, features, or claims not stated here.",
    guardrail ?? "",
    "",
    "Verified facts:",
    `- Name: ${item.name}`,
    `- Subtitle: ${item.subtitle}`,
    `- Price: ${formatMoney(item.price, item.currency)}`,
    `- Highlights: ${item.highlights.join("; ")}`,
    `- Attributes: ${JSON.stringify(item.attributes)}`,
    "",
    "Return ONLY a JSON object of this exact shape, no other text:",
    `{"summary": "a polished 2-3 sentence marketing summary", "highlights": ["3-5 short highlight phrases, grounded only in the facts above"], "arabic": {"summary": "Arabic translation of the summary above", "highlights": ["Arabic translation of each highlight, same order"]}}`,
  ]
    .filter(Boolean)
    .join("\n");
}

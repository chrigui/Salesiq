import type { InventoryItem, IndustryPack } from "@/core/types";
import type { AiSettingsShape } from "@/core/data/aiSettingsShared";
import { WIDGET_TYPES, type WidgetType, type DisplayTemplateId } from "@/lib/displayProfiles/sections";
import { MOTION_PRESET_IDS, type MotionPresetId } from "@/core/display/motionPresets";
import type { DisplaySection } from "@/lib/serializers/displayProfile";
import { isWidgetRelevant } from "@/lib/displayProfiles/widgetRelevance";

export interface DisplayDesignAsset {
  name: string;
  mimeType: string;
}

const TEMPLATE_IDS: DisplayTemplateId[] = [
  "Minimal",
  "NewDevelopment",
  "Detailed",
  "Lifestyle",
  "Investment",
  "LuxuryCinematic",
  "Cinematic",
  "Masterplan",
  "Custom",
  "Dashboard",
];

export interface DisplayDesignResult {
  sections: DisplaySection[];
  motion: { preset: MotionPresetId; reduceMotion: boolean };
  rationale: string;
  /** Only meaningful for the from-scratch ("Describe it") flow — an existing profile's own template is left untouched otherwise. */
  template?: DisplayTemplateId;
}

const NON_CUSTOM_PRESETS = MOTION_PRESET_IDS.filter((p) => p !== "Custom") as Exclude<MotionPresetId, "Custom">[];

/** Turns an ordered list of {type, enabled} into full DisplaySection objects — any missing widget type is appended disabled, any unknown type is dropped, so the result always covers the full catalog (nothing becomes unreachable in the toggle-only editor). */
function toFullSections(ordered: { type: string; enabled: boolean }[]): DisplaySection[] {
  const seen = new Set<string>();
  const sections: DisplaySection[] = [];
  for (const entry of ordered) {
    if (!WIDGET_TYPES.includes(entry.type as WidgetType) || seen.has(entry.type)) continue;
    seen.add(entry.type);
    sections.push({ id: entry.type, type: entry.type, enabled: Boolean(entry.enabled), order: sections.length });
  }
  for (const type of WIDGET_TYPES) {
    if (seen.has(type)) continue;
    sections.push({ id: type, type, enabled: false, order: sections.length });
  }
  return sections;
}

/** Validates/coerces a possibly-malformed Claude response into a real result — a bad or invented field can never corrupt the profile. */
export function coerceDisplayDesign(raw: unknown): DisplayDesignResult | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { sections?: unknown; preset?: unknown; reduceMotion?: unknown; rationale?: unknown; template?: unknown };
  if (!Array.isArray(r.sections)) return null;

  const ordered = r.sections
    .filter((s): s is { type: unknown; enabled: unknown } => Boolean(s) && typeof s === "object")
    .map((s) => ({ type: String((s as { type: unknown }).type ?? ""), enabled: Boolean((s as { enabled: unknown }).enabled) }));
  if (ordered.length === 0) return null;

  const preset = NON_CUSTOM_PRESETS.includes(r.preset as Exclude<MotionPresetId, "Custom">)
    ? (r.preset as Exclude<MotionPresetId, "Custom">)
    : "Cinematic";

  const template = TEMPLATE_IDS.includes(r.template as DisplayTemplateId) ? (r.template as DisplayTemplateId) : undefined;

  return {
    sections: toFullSections(ordered),
    motion: { preset, reduceMotion: Boolean(r.reduceMotion) },
    rationale: typeof r.rationale === "string" && r.rationale.trim() ? r.rationale.trim() : "AI-proposed composition.",
    ...(template ? { template } : {}),
  };
}

export function buildDisplayDesignPrompt(
  item: InventoryItem,
  pack: IndustryPack,
  assets: DisplayDesignAsset[],
  settings: AiSettingsShape,
  intent?: string,
): string {
  const facts = [
    `Item: ${item.name} — ${item.subtitle}`,
    `Price: ${item.price} ${item.currency}`,
    `Photos: ${[item.photo, ...(item.gallery ?? [])].filter(Boolean).length}`,
    `Highlights: ${item.highlights.length > 0 ? item.highlights.join("; ") : "none listed"}`,
    `Specs/attributes: ${Object.keys(item.attributes).length > 0 ? Object.entries(item.attributes).map(([k, v]) => `${k}=${v}`).join(", ") : "none"}`,
    `3-yr appreciation: ${item.appreciation != null ? `${item.appreciation}%` : "not tracked for this item"}`,
    `Neighborhood/lifestyle data: ${item.lifestyle ? "available" : "not available"}`,
    `Uploaded documents: ${assets.length > 0 ? assets.map((a) => `${a.name} (${a.mimeType})`).join(", ") : "none"}`,
    `Industry: ${pack.vertical}`,
    `Other items in this pack for comparison: ${Math.max(0, pack.inventory.length - 1)}`,
  ].join("\n");

  const intentLine = intent?.trim()
    ? `\nThe admin creating this profile described what they want in their own words: "${intent.trim()}". Use this to guide tone/template/motion choices, but never let it override the real facts below — still only enable widgets the data genuinely supports.\n`
    : "";

  return `You are designing the widget composition for a Customer Display presentation of a real listing — the screen a customer sees in person during a sales meeting. Every widget shows real data already in the system; you are choosing WHICH of the following widgets to enable and in what order, plus a motion style and a template. Never invent facts about the item — you only decide structure.
${intentLine}
Available widget types, in their default order: ${WIDGET_TYPES.join(", ")}.
Only enable a widget when the underlying data genuinely supports it (e.g. don't enable "investment" if no appreciation figure exists, don't enable "neighborhood" if there's no lifestyle data, don't enable "documents" if none were uploaded).
Available motion presets: ${NON_CUSTOM_PRESETS.join(", ")}.
Available templates: ${TEMPLATE_IDS.join(", ")}.

Real data for this listing:
${facts}

Tone preference: ${settings.tone}.

Respond with ONLY a JSON object of this exact shape, no prose outside it:
{
  "sections": [{"type": "hero", "enabled": true}, ...one entry per widget type above, in your proposed order...],
  "preset": "Cinematic",
  "reduceMotion": false,
  "template": "Cinematic",
  "rationale": "One or two sentences explaining the choices, referencing only the real facts above."
}`;
}

/** Simple keyword-based template pick for the from-scratch flow's non-Claude fallback — never used to override an existing profile's own template. */
function keywordTemplate(intent: string | undefined, pack: IndustryPack): DisplayTemplateId | undefined {
  const text = intent?.trim().toLowerCase();
  if (!text) return undefined;
  if (/luxury|premium|high-?end|exclusive/.test(text)) return "LuxuryCinematic";
  if (/masterplan|master plan|development plan|site plan/.test(text)) return "Masterplan";
  if (/new development|off-?plan|pre-?construction|launch/.test(text)) return "NewDevelopment";
  if (/invest(ment)?|roi|yield|rental/.test(text)) return "Investment";
  if (/lifestyle|neighborhood|community|amenit/.test(text)) return "Lifestyle";
  if (/cinematic|dramatic|video|film/.test(text)) return "Cinematic";
  if (/minimal|clean|simple/.test(text)) return "Minimal";
  if (/dashboard|data|metrics|overview/.test(text)) return "Dashboard";
  if (/detail|spec|technical/.test(text)) return "Detailed";
  if (/jet|yacht/.test(pack.vertical.toLowerCase())) return "LuxuryCinematic";
  return undefined;
}

/** Deterministic fallback — no Claude call, no invented facts, just real signals already on the item/pack driving which widgets make sense. */
export function deterministicDisplayDesign(
  item: InventoryItem,
  pack: IndustryPack,
  assets: DisplayDesignAsset[],
  intent?: string,
): DisplayDesignResult {
  // Presentation-only booleans for the human-readable rationale below —
  // widget enablement itself comes from isWidgetRelevant(), the single
  // shared source of truth also used by the editor's "When relevant"
  // widget-visibility option.
  const hasPhotos = [item.photo, ...(item.gallery ?? [])].filter(Boolean).length > 1;
  const hasLifestyle = Boolean(item.lifestyle);
  const hasDocs = assets.length > 0;
  const hasAppreciation = item.appreciation != null;
  const hasComparables = pack.inventory.length > 1;

  const enabled: Record<WidgetType, boolean> = Object.fromEntries(
    WIDGET_TYPES.map((type) => [type, isWidgetRelevant(type, item, pack, assets)]),
  ) as Record<WidgetType, boolean>;

  const preset: Exclude<MotionPresetId, "Custom"> = /jet|yacht|luxury/i.test(pack.vertical)
    ? "Luxury"
    : /automotive/i.test(pack.vertical)
      ? "Dynamic"
      : "Cinematic";

  const reasons: string[] = [];
  if (hasAppreciation) reasons.push(`a tracked ${item.appreciation}% appreciation figure`);
  if (hasLifestyle) reasons.push("neighborhood data");
  if (hasDocs) reasons.push(`${assets.length} uploaded document${assets.length === 1 ? "" : "s"}`);
  if (hasPhotos) reasons.push("a real photo gallery");
  if (hasComparables) reasons.push(`${pack.inventory.length - 1} comparable listing${pack.inventory.length - 1 === 1 ? "" : "s"} in this pack`);

  const rationale =
    reasons.length > 0
      ? `Enabled widgets backed by real data on this listing: ${reasons.join(", ")}. Widgets with no supporting data were left off rather than shown empty.`
      : "This listing has limited supporting data beyond the core details, so only the essentials are enabled — add photos, specs, or documents to unlock more widgets.";

  const template = keywordTemplate(intent, pack);

  return {
    sections: toFullSections(WIDGET_TYPES.map((type) => ({ type, enabled: enabled[type] }))),
    motion: { preset, reduceMotion: false },
    rationale,
    ...(template ? { template } : {}),
  };
}

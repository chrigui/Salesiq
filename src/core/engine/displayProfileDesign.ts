import type { InventoryItem, IndustryPack } from "@/core/types";
import type { AiSettingsShape } from "@/core/data/aiSettingsShared";
import { WIDGET_TYPES, type WidgetType } from "@/lib/displayProfiles/sections";
import { MOTION_PRESET_IDS, type MotionPresetId } from "@/core/display/motionPresets";
import type { DisplaySection } from "@/lib/serializers/displayProfile";

export interface DisplayDesignAsset {
  name: string;
  mimeType: string;
}

export interface DisplayDesignResult {
  sections: DisplaySection[];
  motion: { preset: MotionPresetId; reduceMotion: boolean };
  rationale: string;
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
  const r = raw as { sections?: unknown; preset?: unknown; reduceMotion?: unknown; rationale?: unknown };
  if (!Array.isArray(r.sections)) return null;

  const ordered = r.sections
    .filter((s): s is { type: unknown; enabled: unknown } => Boolean(s) && typeof s === "object")
    .map((s) => ({ type: String((s as { type: unknown }).type ?? ""), enabled: Boolean((s as { enabled: unknown }).enabled) }));
  if (ordered.length === 0) return null;

  const preset = NON_CUSTOM_PRESETS.includes(r.preset as Exclude<MotionPresetId, "Custom">)
    ? (r.preset as Exclude<MotionPresetId, "Custom">)
    : "Cinematic";

  return {
    sections: toFullSections(ordered),
    motion: { preset, reduceMotion: Boolean(r.reduceMotion) },
    rationale: typeof r.rationale === "string" && r.rationale.trim() ? r.rationale.trim() : "AI-proposed composition.",
  };
}

export function buildDisplayDesignPrompt(
  item: InventoryItem,
  pack: IndustryPack,
  assets: DisplayDesignAsset[],
  settings: AiSettingsShape,
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

  return `You are designing the widget composition for a Customer Display presentation of a real listing — the screen a customer sees in person during a sales meeting. Every widget shows real data already in the system; you are choosing WHICH of the following widgets to enable and in what order, plus a motion style. Never invent facts about the item — you only decide structure.

Available widget types, in their default order: ${WIDGET_TYPES.join(", ")}.
Only enable a widget when the underlying data genuinely supports it (e.g. don't enable "investment" if no appreciation figure exists, don't enable "neighborhood" if there's no lifestyle data, don't enable "documents" if none were uploaded).
Available motion presets: ${NON_CUSTOM_PRESETS.join(", ")}.

Real data for this listing:
${facts}

Tone preference: ${settings.tone}.

Respond with ONLY a JSON object of this exact shape, no prose outside it:
{
  "sections": [{"type": "hero", "enabled": true}, ...one entry per widget type above, in your proposed order...],
  "preset": "Cinematic",
  "reduceMotion": false,
  "rationale": "One or two sentences explaining the choices, referencing only the real facts above."
}`;
}

/** Deterministic fallback — no Claude call, no invented facts, just real signals already on the item/pack driving which widgets make sense. */
export function deterministicDisplayDesign(
  item: InventoryItem,
  pack: IndustryPack,
  assets: DisplayDesignAsset[],
): DisplayDesignResult {
  const hasPhotos = [item.photo, ...(item.gallery ?? [])].filter(Boolean).length > 1;
  const hasHighlights = item.highlights.length > 0;
  const hasSpecs = Object.keys(item.attributes).length > 0;
  const hasLifestyle = Boolean(item.lifestyle);
  const hasImageDoc = assets.some((a) => a.mimeType.startsWith("image/"));
  const hasDocs = assets.length > 0;
  const hasAppreciation = item.appreciation != null;
  const hasComparables = pack.inventory.length > 1;
  const hasNearbyAmenities = (item.nearbyAmenities?.length ?? 0) > 0;
  const hasLocation = Boolean(item.location);
  const hasScoring = pack.rules.length > 0;
  const hasAvailability = item.unitsLeft != null;

  const enabled: Record<WidgetType, boolean> = {
    hero: true,
    gallery: hasPhotos,
    highlights: hasHighlights,
    specs: hasSpecs,
    neighborhood: hasLifestyle,
    masterplan: hasImageDoc,
    documents: hasDocs,
    investment: hasAppreciation,
    comparables: hasComparables,
    aiPromptTicker: true,
    trustBadges: hasPhotos || hasDocs || hasLifestyle || hasSpecs,
    continueQr: true,
    leadCapture: true,
    heroCard: true,
    matchScore: hasScoring,
    nearbyPlaces: hasNearbyAmenities,
    investmentSnapshot: hasAppreciation,
    galleryCard: hasPhotos,
    locationMap: hasLocation,
    priceSummary: true,
    availability: hasAvailability,
    comparisonMini: hasComparables,
    comparisonTable: hasComparables,
    documentsCard: hasDocs,
    saveShare: true,
    leadCaptureCard: true,
    progressSteps: true,
    aiInsight: hasScoring,
  };

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

  return {
    sections: toFullSections(WIDGET_TYPES.map((type) => ({ type, enabled: enabled[type] }))),
    motion: { preset, reduceMotion: false },
    rationale,
  };
}

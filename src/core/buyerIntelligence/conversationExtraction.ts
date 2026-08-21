/**
 * Natural-language "describe the customer" extraction — the spec's §10.
 * Deliberately separate from /api/ai/search's extraction: that route fills
 * the CURRENT pack's Answers for live scoring; this one fills a persistent
 * BuyerProfile's broader field set (cross-session, cross-pack) and always
 * goes through a CONFIRM/EDIT/REJECT step before anything is trusted as
 * fact — never auto-applied, unlike /api/ai/search's one-shot fill.
 */
export interface BuyerExtraction {
  familySize?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  budget?: string;
  preferredLocation?: string;
  purposes?: string[];
  /** The single strongest theme mentioned (e.g. "Schools"). */
  priorityLabel?: string;
  /** A secondary theme mentioned (e.g. "Investment"). */
  secondaryLabel?: string;
}

export const ALLOWED_PURPOSES = [
  "End user",
  "Investment",
  "Second home",
  "Holiday home",
  "Rental",
  "Business use",
  "Other",
];

/** Every extracted value — Claude or fallback — is forced through this before it's trusted, so a bad or hallucinated response can never write garbage into the profile. */
export function coerceExtraction(raw: unknown): BuyerExtraction {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const out: BuyerExtraction = {};

  const num = (v: unknown, max: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 && n <= max ? Math.round(n) : undefined;
  };
  const str = (v: unknown, max = 200) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;

  out.familySize = num(r.familySize, 20);
  out.bedrooms = num(r.bedrooms, 20);
  out.bathrooms = num(r.bathrooms, 20);
  out.propertyType = str(r.propertyType);
  out.budget = str(r.budget, 100);
  out.preferredLocation = str(r.preferredLocation);
  out.priorityLabel = str(r.priorityLabel, 100);
  out.secondaryLabel = str(r.secondaryLabel, 100);
  if (Array.isArray(r.purposes)) {
    const purposes = r.purposes.map((p) => String(p)).filter((p) => ALLOWED_PURPOSES.includes(p));
    if (purposes.length > 0) out.purposes = purposes;
  }

  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined)) as BuyerExtraction;
}

export function buildBuyerExtractionPrompt(text: string): string {
  return [
    `A salesperson is describing a prospective buyer in free text, for a private CRM-style profile — not a specific product listing's Q&A.`,
    `Extract only the facts the text clearly states or clearly implies. Never guess a value that isn't there.`,
    ``,
    `Fields (all optional, omit any not mentioned):`,
    `- familySize: integer, household size`,
    `- propertyType: short string, e.g. "apartment", "villa"`,
    `- bedrooms: integer`,
    `- bathrooms: integer`,
    `- budget: short string as stated, e.g. "around €2,000,000" or "$300k-400k"`,
    `- preferredLocation: short string`,
    `- purposes: array, each one of exactly: ${ALLOWED_PURPOSES.map((p) => `"${p}"`).join(", ")}`,
    `- priorityLabel: the single strongest theme/priority mentioned, as a short phrase (e.g. "Schools", "Sea view", "Investment potential")`,
    `- secondaryLabel: a secondary theme mentioned, if any`,
    ``,
    `Customer description: "${text}"`,
    ``,
    `Respond with only a single JSON object.`,
  ].join("\n");
}

/** Deterministic fallback — reuses the same real-figure/keyword techniques as /api/ai/search's keyword extractor, just aimed at BuyerProfile's broader fields instead of one pack's questions. */
export function deterministicExtract(text: string): BuyerExtraction {
  const lower = text.toLowerCase();
  const out: BuyerExtraction = {};

  const familyMatch = lower.match(/family of (\d+)|household of (\d+)|(\d+)\s*(?:people|person)/);
  if (familyMatch) {
    const n = Number(familyMatch[1] ?? familyMatch[2] ?? familyMatch[3]);
    if (Number.isFinite(n)) out.familySize = n;
  }

  const bedroomMatch = lower.match(/(\d+)\s*[- ]?(?:bedrooms?|beds?|br)\b/);
  if (bedroomMatch) out.bedrooms = Number(bedroomMatch[1]);
  const bathroomMatch = lower.match(/(\d+)\s*[- ]?(?:bathrooms?|baths?)\b/);
  if (bathroomMatch) out.bathrooms = Number(bathroomMatch[1]);

  const propertyTypes = ["apartment", "villa", "townhouse", "penthouse", "house", "condo", "studio"];
  const type = propertyTypes.find((t) => lower.includes(t));
  if (type) out.propertyType = type;

  const moneyMatch = text.match(/[\$€£]\s?[\d,.]+\s?[kKmM]?|\b\d[\d,.]*\s?[kKmM]\b/);
  if (moneyMatch) out.budget = moneyMatch[0].trim();

  const purposeKeywords: Record<string, string> = {
    invest: "Investment",
    rental: "Rental",
    rent: "Rental",
    "holiday home": "Holiday home",
    "second home": "Second home",
    business: "Business use",
    "live in": "End user",
    "end user": "End user",
  };
  const purposes = Object.entries(purposeKeywords)
    .filter(([kw]) => lower.includes(kw))
    .map(([, label]) => label);
  if (purposes.length > 0) out.purposes = [...new Set(purposes)];

  const themeKeywords: { pattern: RegExp; label: string }[] = [
    { pattern: /school/i, label: "Schools" },
    { pattern: /(sea|ocean|beach|waterfront)/i, label: "Sea view" },
    { pattern: /quiet|peaceful|calm/i, label: "Privacy" },
    { pattern: /garden|yard/i, label: "Garden" },
    { pattern: /invest/i, label: "Investment potential" },
  ];
  const matchedThemes = themeKeywords.filter((t) => t.pattern.test(text)).map((t) => t.label);
  if (matchedThemes[0]) out.priorityLabel = matchedThemes[0];
  if (matchedThemes[1]) out.secondaryLabel = matchedThemes[1];

  return out;
}

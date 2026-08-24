/**
 * Reverse-mapping helpers shared by natural-language capture and "Use
 * existing profile" — both need to turn already-known buyer data
 * (BuyerExtractionFields, or a BuyerProfile's label-keyed
 * requirements/financial) into real session.answers, honestly: a field
 * with no clean match to a real question is simply left out rather than
 * guessed at. Nothing here writes anywhere — callers still apply the
 * result via session.answer() themselves, same confirm-first discipline
 * as the rest of Buyer Intelligence.
 */
import type { Answers, BudgetValue, IndustryPack, Question } from "@/core/types";
import type { BuyerExtractionFields, BuyerProfile } from "@/core/store/buyerProfiles";
import type { BuyerPriority } from "@/core/buyerIntelligence/priorityWeights";

/** The same label <-> real toggle-question mapping buildExtraction (in
 * DiscoveryWizard) already uses in the forward direction — kept in sync
 * here for the reverse direction. */
const PRIORITY_LABEL_TO_QUESTION: Record<string, string> = {
  schools: "schools",
  "sea view": "seaView",
  garden: "garden",
  "quiet area": "quiet",
  quiet: "quiet",
};

function parseBudgetRange(text: string): BudgetValue | undefined {
  const matches = text.match(/[\d,.]+\s*[km]?/gi);
  if (!matches || matches.length < 2) return undefined;
  const toNumber = (token: string): number | undefined => {
    const suffix = token.trim().slice(-1).toLowerCase();
    const isK = suffix === "k";
    const isM = suffix === "m";
    const digits = (isK || isM ? token.trim().slice(0, -1) : token).replace(/,/g, "");
    const n = Number(digits);
    if (!Number.isFinite(n)) return undefined;
    return isK ? n * 1_000 : isM ? n * 1_000_000 : n;
  };
  const [a, b] = matches.map(toNumber);
  if (a === undefined || b === undefined) return undefined;
  return a <= b ? { min: a, max: b } : { min: b, max: a };
}

function matchOptionIds(question: Question | undefined, text: string): string[] {
  if (!question?.options) return [];
  const tokens = text
    .split(/,|\/| and | or /i)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const matched: string[] = [];
  for (const token of tokens) {
    const opt = question.options.find(
      (o) => o.label.toLowerCase() === token || token.includes(o.label.toLowerCase()) || o.label.toLowerCase().includes(token),
    );
    if (opt && !matched.includes(opt.id)) matched.push(opt.id);
  }
  return matched;
}

/** BuyerExtractionFields -> real session.answers, honest and additive. */
export function mapExtractionToAnswers(pack: IndustryPack, extracted: BuyerExtractionFields): Partial<Answers> {
  const out: Partial<Answers> = {};

  if (typeof extracted.familySize === "number") out.familySize = extracted.familySize;
  if (typeof extracted.bedrooms === "number") out.bedrooms = extracted.bedrooms;
  if (extracted.preferredLocation?.trim()) out.workLocation = extracted.preferredLocation.trim();

  if (extracted.propertyType) {
    const q = pack.questions.find((q) => q.id === "propertyType");
    const matched = matchOptionIds(q, extracted.propertyType);
    if (matched.length > 0) out.propertyType = matched;
  }

  if (extracted.budget) {
    const parsed = parseBudgetRange(extracted.budget);
    if (parsed) out.budget = parsed;
  }

  for (const label of [extracted.priorityLabel, extracted.secondaryLabel]) {
    if (!label) continue;
    const questionId = PRIORITY_LABEL_TO_QUESTION[label.trim().toLowerCase()];
    if (questionId && pack.questions.some((q) => q.id === questionId)) out[questionId] = true;
  }

  return out;
}

/** A saved BuyerProfile's requirements/financial (human-label-keyed
 * BuyerField<string>) + ranked priorities -> the same real session.answers
 * shape, by first reconstructing the equivalent BuyerExtractionFields and
 * reusing the exact same parsing above — one mapping, not two. */
export function mapBuyerProfileToAnswers(
  pack: IndustryPack,
  profile: Pick<BuyerProfile, "requirements" | "financial" | "priorities">,
): Partial<Answers> {
  const req = profile.requirements ?? {};
  const fin = profile.financial ?? {};
  const asString = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

  const extracted: BuyerExtractionFields = {
    familySize: numberFrom(req["Family size"]?.value),
    bedrooms: numberFrom(req["Bedrooms"]?.value),
    propertyType: asString(req["Property type"]?.value),
    preferredLocation: asString(req["Preferred location"]?.value),
    budget: asString(fin["Budget range"]?.value),
  };

  const answers = mapExtractionToAnswers(pack, extracted);

  const priorities: BuyerPriority[] = profile.priorities ?? [];
  for (const p of priorities) {
    const questionId = PRIORITY_LABEL_TO_QUESTION[p.requirement.trim().toLowerCase()];
    if (questionId && pack.questions.some((q) => q.id === questionId)) answers[questionId] = true;
  }

  return answers;
}

function numberFrom(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  return undefined;
}

/** How many requirement/financial fields exist on a profile that this
 * mapping could NOT place onto a real question — surfaced honestly rather
 * than silently dropped, per "captured but not pre-fillable for the rest". */
export function countUnmappedFields(
  profile: Pick<BuyerProfile, "requirements" | "financial">,
  mappedCount: number,
): number {
  const total = Object.keys(profile.requirements ?? {}).length + Object.keys(profile.financial ?? {}).length;
  return Math.max(0, total - mappedCount);
}

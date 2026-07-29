import type {
  InventoryItem,
  Question,
  QuestionOption,
  QuestionType,
  RuleKind,
  RuleSpec,
} from "@/core/types";

/**
 * Smart Wizard (Module 4 · Question Builder / Company Dashboard).
 *
 * "10 minutes until the client meeting" — describe the business in a
 * sentence and get a working dashboard: questions, sample inventory and
 * scoring rules, all consistent with each other and ready to demo. This is
 * the content half of a pack (branding stays hand-authored in the Branding
 * tab, since a tenant usually already picked their name/colors when
 * creating the pack).
 *
 * Claude-authored when ANTHROPIC_API_KEY is set (buildWizardPrompt); a
 * deterministic generic starter template otherwise, so the feature never
 * hard-fails on a live floor with no key configured. Either way, every
 * output — AI or template — is run through `coercePackContent` before it
 * touches the pack: types are checked, ids are slugified and de-duplicated,
 * rule specs that reference a question that doesn't exist are dropped, and
 * counts are capped, so a malformed or over-eager generation can never
 * corrupt the pack or break the scoring engine.
 */
export interface WizardPackContent {
  sections: { id: string; label: string }[];
  questions: Question[];
  inventory: InventoryItem[];
  ruleSpecs: RuleSpec[];
}

const QUESTION_TYPES: QuestionType[] = [
  "single",
  "multi",
  "budget",
  "slider",
  "toggle",
  "counter",
];
const RULE_KINDS: RuleKind[] = ["budget", "atLeast", "proximity", "feature", "investment"];
const GRADIENT_TOKENS = ["emerald", "sky", "amber", "violet", "rose"];

const MAX_QUESTIONS = 8;
const MAX_INVENTORY = 6;
const MAX_RULES = 8;

function slugify(input: string, fallback: string): string {
  const s = String(input ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || fallback;
}

function uniqueSlug(input: string, fallback: string, used: Set<string>): string {
  const base = slugify(input, fallback);
  let id = base;
  let n = 2;
  while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  return id;
}

/**
 * The prompt sent to Claude. Describes the exact JSON shape expected —
 * every field coerce checks for below — so the model's output lands close
 * to valid on the first try even before sanitisation.
 */
export function buildWizardPrompt(
  description: string,
  opts: { label: string; vertical: string; currency: string },
): string {
  return [
    `You are designing a sales decision-tool for "${opts.label}", a ${opts.vertical} business.`,
    `Business description from the tenant: "${description}"`,
    ``,
    `Generate the content for a working demo: 4-6 customer-facing questions, 3-5 sample inventory items, and 4-6 scoring rules connecting them. Respond with ONLY a single JSON object, no prose, matching exactly:`,
    ``,
    `{`,
    `  "sections": [{ "id": "kebab-case", "label": "Display label" }],`,
    `  "questions": [{`,
    `    "id": "kebab-case-unique",`,
    `    "label": "short label for the salesperson's phone",`,
    `    "prompt": "full question shown to the customer",`,
    `    "type": "single | multi | budget | slider | toggle | counter",`,
    `    "section": "must match a section id above",`,
    `    "options": [{ "id": "kebab-case", "label": "..." }],  // required for single/multi only`,
    `    "min": number, "max": number, "step": number, "unit": "string",  // required for budget/slider/counter`,
    `    "weight": number  // 1-3, only for budget questions`,
    `  }],`,
    `  "inventory": [{`,
    `    "id": "kebab-case-unique",`,
    `    "name": "product/item name",`,
    `    "subtitle": "one line description",`,
    `    "price": number,`,
    `    "currency": "${opts.currency}",`,
    `    "image": "one of: ${GRADIENT_TOKENS.join(", ")}",`,
    `    "attributes": { "attributeName": number | string | boolean },`,
    `    "highlights": ["short selling point", "..."]`,
    `  }],`,
    `  "ruleSpecs": [{`,
    `    "id": "kebab-case-unique",`,
    `    "kind": "budget | atLeast | feature | proximity | investment",`,
    `    "questionId": "must match a question id above",`,
    `    "attribute": "must match an inventory attribute key (omit for budget/investment)",`,
    `    "weight": number,`,
    `    "reason": "template using {have} and {need} for atLeast, plain text for feature"`,
    `  }]`,
    `}`,
    ``,
    `Rules: every question id/section id/attribute name referenced elsewhere must exist. Include exactly one "budget" question and one matching "budget" ruleSpec. Inventory attribute keys must line up with what the ruleSpecs check (e.g. a "guests" atLeast rule needs every item to have a numeric "guests" attribute). Keep everything realistic for the described business — no placeholder text.`,
  ].join("\n");
}

/** Sanitises and validates arbitrary parsed JSON (AI or template) into a
 * pack-safe shape. Never trusts input — every id is slugified/deduped,
 * every reference is checked, every count is capped. */
export function coercePackContent(
  raw: unknown,
  opts: { currency: string },
): WizardPackContent {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const sectionIds = new Set<string>();
  let sections = (Array.isArray(r.sections) ? r.sections : [])
    .slice(0, 6)
    .map((s, i) => {
      const o = (s ?? {}) as Record<string, unknown>;
      return {
        id: uniqueSlug(String(o.id ?? o.label ?? `section-${i}`), `section-${i}`, sectionIds),
        label: String(o.label ?? "General").slice(0, 40) || "General",
      };
    });
  if (sections.length === 0) sections = [{ id: "general", label: "General" }];
  const validSectionIds = new Set(sections.map((s) => s.id));
  const defaultSection = sections[0].id;

  const questionIds = new Set<string>();
  const questions: Question[] = (Array.isArray(r.questions) ? r.questions : [])
    .slice(0, MAX_QUESTIONS)
    .map((q, i) => {
      const o = (q ?? {}) as Record<string, unknown>;
      const type = QUESTION_TYPES.includes(o.type as QuestionType)
        ? (o.type as QuestionType)
        : "single";
      const id = uniqueSlug(String(o.id ?? o.label ?? `question-${i}`), `question-${i}`, questionIds);
      const section = validSectionIds.has(String(o.section)) ? String(o.section) : defaultSection;

      const question: Question = {
        id,
        label: String(o.label ?? `Question ${i + 1}`).slice(0, 60),
        prompt: String(o.prompt ?? o.label ?? `Question ${i + 1}`).slice(0, 160),
        type,
        section,
      };

      if (type === "single" || type === "multi") {
        const optionIds = new Set<string>();
        const rawOptions = Array.isArray(o.options) ? o.options : [];
        const options: QuestionOption[] = rawOptions.slice(0, 8).map((opt, oi) => {
          const oo = (opt ?? {}) as Record<string, unknown>;
          return {
            id: uniqueSlug(String(oo.id ?? oo.label ?? `option-${oi}`), `option-${oi}`, optionIds),
            label: String(oo.label ?? `Option ${oi + 1}`).slice(0, 40),
          };
        });
        question.options = options.length
          ? options
          : [{ id: "yes", label: "Yes" }, { id: "no", label: "No" }];
      }

      if (type === "budget" || type === "slider" || type === "counter") {
        const min = Number(o.min);
        const max = Number(o.max);
        question.min = Number.isFinite(min) ? min : type === "budget" ? 10000 : 1;
        question.max = Number.isFinite(max) && max > (question.min ?? 0) ? max : (question.min ?? 0) + 100;
        const step = Number(o.step);
        question.step = Number.isFinite(step) && step > 0 ? step : type === "budget" ? 5000 : 1;
        if (o.unit) question.unit = String(o.unit).slice(0, 20);
      }

      const weight = Number(o.weight);
      if (Number.isFinite(weight)) question.weight = Math.min(5, Math.max(0.5, weight));

      return question;
    });

  if (questions.length === 0) {
    questions.push({
      id: "budget",
      label: "Budget",
      prompt: "What's your budget range?",
      type: "budget",
      section: defaultSection,
      min: 10000,
      max: 100000,
      step: 5000,
      unit: opts.currency,
      weight: 3,
    });
  }
  const validQuestionIds = new Set(questions.map((q) => q.id));

  const inventoryIds = new Set<string>();
  const inventory: InventoryItem[] = (Array.isArray(r.inventory) ? r.inventory : [])
    .slice(0, MAX_INVENTORY)
    .map((it, i) => {
      const o = (it ?? {}) as Record<string, unknown>;
      const price = Number(o.price);
      const rawAttrs = (o.attributes && typeof o.attributes === "object" ? o.attributes : {}) as Record<
        string,
        unknown
      >;
      const attributes: Record<string, number | string | boolean> = {};
      for (const [k, v] of Object.entries(rawAttrs)) {
        if (typeof v === "number" || typeof v === "string" || typeof v === "boolean") {
          attributes[k] = v;
        }
      }
      const highlights = Array.isArray(o.highlights)
        ? o.highlights.slice(0, 5).map((h) => String(h).slice(0, 60))
        : [];
      return {
        id: uniqueSlug(String(o.id ?? o.name ?? `item-${i}`), `item-${i}`, inventoryIds),
        name: String(o.name ?? `Item ${i + 1}`).slice(0, 60),
        subtitle: String(o.subtitle ?? "").slice(0, 100),
        price: Number.isFinite(price) && price > 0 ? price : 50000,
        currency: typeof o.currency === "string" ? o.currency : opts.currency,
        image: GRADIENT_TOKENS.includes(String(o.image)) ? String(o.image) : GRADIENT_TOKENS[i % GRADIENT_TOKENS.length],
        attributes,
        highlights,
      };
    });

  const ruleIds = new Set<string>();
  const ruleSpecs: RuleSpec[] = (Array.isArray(r.ruleSpecs) ? r.ruleSpecs : [])
    .slice(0, MAX_RULES)
    .map((rs, i) => {
      const o = (rs ?? {}) as Record<string, unknown>;
      const kind = RULE_KINDS.includes(o.kind as RuleKind) ? (o.kind as RuleKind) : null;
      const questionId = String(o.questionId ?? "");
      if (!kind || !validQuestionIds.has(questionId)) return null;
      const weight = Number(o.weight);
      const spec: RuleSpec = {
        id: uniqueSlug(String(o.id ?? `rule-${i}`), `rule-${i}`, ruleIds),
        kind,
        questionId,
        weight: Number.isFinite(weight) ? Math.min(5, Math.max(0.5, weight)) : 2,
      };
      if (kind !== "budget" && kind !== "investment") {
        spec.attribute = String(o.attribute ?? questionId);
      }
      if (o.reason) spec.reason = String(o.reason).slice(0, 120);
      if (kind === "proximity") {
        const ceiling = Number(o.ceiling);
        spec.ceiling = Number.isFinite(ceiling) ? ceiling : 15;
      }
      return spec;
    })
    .filter((s): s is RuleSpec => s !== null);

  if (ruleSpecs.length === 0) {
    const budgetQ = questions.find((q) => q.type === "budget");
    if (budgetQ) {
      ruleSpecs.push({ id: "budget-fit", kind: "budget", questionId: budgetQ.id, weight: 3 });
    }
  }

  return { sections, questions, inventory, ruleSpecs };
}

/**
 * The deterministic fallback — a generic but genuinely usable starter
 * template, used when ANTHROPIC_API_KEY isn't set or the Claude call fails.
 * Honestly generic (no invented product facts), clearly editable — the
 * point is a working skeleton to demo the flow, not finished content.
 */
export function generateTemplatePack(opts: { label: string; currency: string }): WizardPackContent {
  const raw = {
    sections: [
      { id: "preferences", label: "Preferences" },
      { id: "budget", label: "Budget" },
    ],
    questions: [
      {
        id: "priority",
        label: "Top priority",
        prompt: "What matters most to you?",
        type: "single",
        section: "preferences",
        options: [
          { id: "value", label: "Best value" },
          { id: "quality", label: "Highest quality" },
          { id: "speed", label: "Fastest turnaround" },
        ],
      },
      {
        id: "quantity",
        label: "Quantity",
        prompt: "How many do you need?",
        type: "counter",
        section: "preferences",
        min: 1,
        max: 20,
      },
      {
        id: "premium",
        label: "Premium tier",
        prompt: "Are you interested in our premium tier?",
        type: "toggle",
        section: "preferences",
      },
      {
        id: "budget",
        label: "Budget",
        prompt: "What's your budget range?",
        type: "budget",
        section: "budget",
        min: 10000,
        max: 150000,
        step: 5000,
        unit: opts.currency,
        weight: 3,
      },
    ],
    inventory: [
      {
        id: "starter",
        name: `${opts.label} — Starter`,
        subtitle: "Entry-level option",
        price: 25000,
        image: "sky",
        attributes: { quantity: 5, premium: false },
        highlights: ["Great starting point", "Fast to get going"],
      },
      {
        id: "standard",
        name: `${opts.label} — Standard`,
        subtitle: "Our most popular option",
        price: 65000,
        image: "emerald",
        attributes: { quantity: 10, premium: false },
        highlights: ["Best all-round value", "Covers most needs"],
      },
      {
        id: "premium",
        name: `${opts.label} — Premium`,
        subtitle: "Top-of-line option",
        price: 140000,
        image: "violet",
        attributes: { quantity: 20, premium: true },
        highlights: ["Every feature included", "Priority support"],
      },
    ],
    ruleSpecs: [
      { id: "budget-fit", kind: "budget", questionId: "budget", weight: 3 },
      {
        id: "quantity-min",
        kind: "atLeast",
        questionId: "quantity",
        attribute: "quantity",
        weight: 2,
        reason: "it covers a quantity of {have}, meeting your {need}",
      },
      {
        id: "premium-match",
        kind: "feature",
        questionId: "premium",
        attribute: "premium",
        weight: 2,
        reason: "it includes the premium tier you asked for",
      },
    ],
  };
  return coercePackContent(raw, opts);
}

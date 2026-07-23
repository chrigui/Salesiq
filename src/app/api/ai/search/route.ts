import { NextResponse } from "next/server";
import { getPack } from "@/core/industries";
import type { Answers, AnswerValue, IndustryPack, Question } from "@/core/types";

/**
 * Natural-language search — the visible "Live Claude AI" feature.
 *
 * A salesperson types a plain sentence ("young family, budget around 300k,
 * needs schools and a garden, four bedrooms") and this endpoint turns it into
 * structured answers that drive the exact same decision engine as the manual
 * question flow. The display reacts instantly.
 *
 * POST { packId, query } -> { answers, source, note }
 *
 * When ANTHROPIC_API_KEY is set we ask Claude to extract the answers against
 * the pack's own questions (industry-agnostic — automotive, jets, medical all
 * work the same way). Without a key it falls back to a deterministic keyword
 * extractor so the feature still works for a demo with zero configuration.
 * Either way every value is coerced and validated against the pack, so a bad
 * extraction can never inject a value the engine doesn't understand.
 */
export async function POST(request: Request) {
  let body: { packId?: string; query?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const pack = getPack(body.packId);
  const query = (body.query ?? "").trim();
  if (!query) {
    return NextResponse.json({ error: "Empty query" }, { status: 400 });
  }

  // Claude-powered extraction, gated on the key. Any failure falls back to the
  // deterministic extractor so the endpoint never hard-fails on a live floor.
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const raw = await extractWithClaude(pack, query);
      const answers = coerceAnswers(pack, raw);
      if (Object.keys(answers).length > 0) {
        return NextResponse.json({ answers, source: "claude" });
      }
    } catch (err) {
      // fall through to keyword extraction
      console.error("Claude extraction failed, using keyword fallback:", err);
    }
  }

  const answers = coerceAnswers(pack, keywordExtract(pack, query));
  return NextResponse.json({
    answers,
    source: "keyword",
    note: process.env.ANTHROPIC_API_KEY
      ? undefined
      : "Set ANTHROPIC_API_KEY for AI-powered extraction.",
  });
}

/* --------------------------------------------------------------------------
 * Claude extraction
 * ------------------------------------------------------------------------ */

async function extractWithClaude(
  pack: IndustryPack,
  query: string,
): Promise<Record<string, unknown>> {
  // Imported lazily so the deterministic path has no dependency on the SDK.
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  const schema = pack.questions
    .map((q) => describeQuestion(q, pack))
    .join("\n");

  const prompt = [
    `You are the intake assistant for ${pack.branding.name}, a ${pack.vertical} business.`,
    `A salesperson describes a customer in free text. Extract only the facts that`,
    `map to the fields below. Return a single JSON object keyed by field id.`,
    `Omit any field the text does not clearly imply — never guess.`,
    ``,
    `Fields:`,
    schema,
    ``,
    `Customer description: "${query}"`,
    ``,
    `Respond with only the JSON object.`,
  ].join("\n");

  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return {};
  return JSON.parse(match[0]) as Record<string, unknown>;
}

/** One human-readable line per question describing what a valid value is. */
function describeQuestion(q: Question, pack: IndustryPack): string {
  const base = `- "${q.id}" (${q.label}): `;
  switch (q.type) {
    case "single":
      return (
        base +
        `one of [${(q.options ?? []).map((o) => `"${o.id}"`).join(", ")}] — ${q.prompt}`
      );
    case "multi":
      return (
        base +
        `any of [${(q.options ?? [])
          .map((o) => `"${o.id}"`)
          .join(", ")}] as a string array — ${q.prompt}`
      );
    case "budget":
      return (
        base +
        `an object { "min": number, "max": number } in ${q.unit ?? pack.currency} — ${q.prompt}`
      );
    case "slider":
      return base + `a number${range(q)} — ${q.prompt}`;
    case "counter":
      return base + `an integer${range(q)} — ${q.prompt}`;
    case "toggle":
      return base + `true or false — ${q.prompt}`;
    default:
      return base + q.prompt;
  }
}

function range(q: Question): string {
  if (q.min == null && q.max == null) return "";
  return ` between ${q.min ?? 0} and ${q.max ?? "∞"}`;
}

/* --------------------------------------------------------------------------
 * Coercion / validation — every extracted value is forced into the shape the
 * engine expects, or dropped. Shared by both extraction paths.
 * ------------------------------------------------------------------------ */

function coerceAnswers(
  pack: IndustryPack,
  raw: Record<string, unknown>,
): Answers {
  const out: Answers = {};
  for (const q of pack.questions) {
    if (!(q.id in raw)) continue;
    const value = coerceValue(q, raw[q.id]);
    if (value !== undefined) out[q.id] = value;
  }
  return out;
}

function coerceValue(q: Question, value: unknown): AnswerValue | undefined {
  switch (q.type) {
    case "single": {
      const id = String(value);
      return q.options?.some((o) => o.id === id) ? id : undefined;
    }
    case "multi": {
      const arr = Array.isArray(value) ? value : [value];
      const ids = arr
        .map((v) => String(v))
        .filter((id) => q.options?.some((o) => o.id === id));
      return ids.length ? ids : undefined;
    }
    case "budget": {
      if (typeof value !== "object" || value === null) return undefined;
      const v = value as Record<string, unknown>;
      const min = Number(v.min);
      const max = Number(v.max);
      if (Number.isFinite(min) && Number.isFinite(max)) {
        return { min: clamp(min, q), max: clamp(max, q) };
      }
      return undefined;
    }
    case "slider":
    case "counter": {
      const n = Number(value);
      if (!Number.isFinite(n)) return undefined;
      return clamp(q.type === "counter" ? Math.round(n) : n, q);
    }
    case "toggle": {
      if (typeof value === "boolean") return value;
      const s = String(value).toLowerCase();
      if (["true", "yes", "1"].includes(s)) return true;
      if (["false", "no", "0"].includes(s)) return false;
      return undefined;
    }
    default:
      return undefined;
  }
}

function clamp(n: number, q: Question): number {
  if (q.min != null) n = Math.max(q.min, n);
  if (q.max != null) n = Math.min(q.max, n);
  return n;
}

/* --------------------------------------------------------------------------
 * Deterministic keyword extractor — the no-key fallback. Generic where it can
 * be (option-label matching, toggles, counters), with a few natural-language
 * niceties (budget figures, "family/couple/single") layered on top.
 * ------------------------------------------------------------------------ */

function keywordExtract(pack: IndustryPack, query: string): Record<string, unknown> {
  const text = query.toLowerCase();
  const out: Record<string, unknown> = {};

  for (const q of pack.questions) {
    switch (q.type) {
      case "single": {
        const hit = matchOption(q, text);
        if (hit) out[q.id] = hit;
        break;
      }
      case "multi": {
        const hits = (q.options ?? [])
          .filter((o) => mentions(text, o.label) || mentions(text, o.id))
          .map((o) => o.id);
        if (hits.length) out[q.id] = hits;
        break;
      }
      case "budget": {
        const budget = extractBudget(text, q);
        if (budget) out[q.id] = budget;
        break;
      }
      case "counter": {
        const n = extractCount(text, q);
        if (n != null) out[q.id] = n;
        break;
      }
      case "toggle": {
        const t = extractToggle(text, q);
        if (t != null) out[q.id] = t;
        break;
      }
      // sliders are hard to guess generically — left to the manual flow.
    }
  }
  return out;
}

/** Match a single-choice question by option label/id, plus household aliases. */
function matchOption(q: Question, text: string): string | undefined {
  for (const o of q.options ?? []) {
    if (mentions(text, o.label) || mentions(text, o.id)) return o.id;
  }
  // Common household phrasing that doesn't literally say "family/couple".
  if (q.id === "household") {
    if (/\b(kids?|children|child)\b/.test(text)) return has(q, "family");
    if (/\b(married|partner|two of us|spouse)\b/.test(text)) return has(q, "couple");
    if (/\b(alone|just me|myself|solo)\b/.test(text)) return has(q, "single");
  }
  return undefined;
}

function has(q: Question, id: string): string | undefined {
  return q.options?.some((o) => o.id === id) ? id : undefined;
}

function extractBudget(
  text: string,
  q: Question,
): { min: number; max: number } | undefined {
  const nums = parseMoneyTokens(text);
  if (nums.length === 0) return undefined;
  if (nums.length >= 2) {
    const sorted = [...nums].sort((a, b) => a - b);
    return { min: sorted[0], max: sorted[sorted.length - 1] };
  }
  // A single figure ("around 300k", "under 500k") becomes a band around it.
  const n = nums[0];
  if (/\b(under|below|max|up to|less than)\b/.test(text)) {
    return { min: q.min ?? 0, max: n };
  }
  if (/\b(over|above|min|from|at least|more than)\b/.test(text)) {
    return { min: n, max: q.max ?? n * 2 };
  }
  return { min: Math.round(n * 0.85), max: Math.round(n * 1.15) };
}

/** Find money figures like "300k", "1.2m", "250,000", "$400000". */
function parseMoneyTokens(text: string): number[] {
  const out: number[] = [];
  const re = /(\d[\d,.]*)\s*([km])?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const digits = m[1].replace(/,/g, "");
    if (!digits || digits === ".") continue;
    let n = parseFloat(digits);
    if (!Number.isFinite(n)) continue;
    const suffix = m[2]?.toLowerCase();
    if (suffix === "k") n *= 1_000;
    else if (suffix === "m") n *= 1_000_000;
    // Ignore small bare numbers that are clearly not prices (bedrooms, size).
    if (!suffix && n < 1000) continue;
    out.push(Math.round(n));
  }
  return out;
}

const WORDS = "(one|two|three|four|five|six|seven|eight)";
const NUM_WORD: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
};

// Cue words per counter, so "four bedrooms" never leaks into "family size".
const COUNTER_CUES: Record<string, string[]> = {
  familySize: ["family of", "family size", "people", "person", "household of"],
  bedrooms: ["bedroom", "bedrooms", "bed", "beds", "br"],
};

function extractCount(text: string, q: Question): number | undefined {
  const cues =
    COUNTER_CUES[q.id] ??
    [q.id.toLowerCase(), q.label.toLowerCase().split(" ")[0]];
  const alt = cues.map(escapeRe).join("|");
  const patterns = [
    // number before the cue: "4 bedrooms", "five people"
    new RegExp(`(\\d+|${WORDS})\\s*(?:${alt})`, "i"),
    // number after the cue: "family of 5", "bedrooms: 4"
    new RegExp(`(?:${alt})\\s*(?:of\\s*|:\\s*)?(\\d+|${WORDS})`, "i"),
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const token = m[1].toLowerCase();
      const n = NUM_WORD[token] ?? parseInt(token, 10);
      if (Number.isFinite(n)) return clamp(n, q);
    }
  }
  return undefined;
}

function extractToggle(text: string, q: Question): boolean | undefined {
  // Build cue words from the question's label + id, e.g. "schools", "garden".
  const cues = [q.id, ...q.label.toLowerCase().split(/\s+/)].filter(
    (w) => w.length > 2 && !["near", "area", "the"].includes(w),
  );
  const extra: Record<string, string[]> = {
    schools: ["school", "schools", "education"],
    seaView: ["sea", "ocean", "beach", "waterfront", "sea view"],
    garden: ["garden", "yard", "outdoor space"],
    quiet: ["quiet", "peaceful", "calm", "tranquil"],
  };
  const words = [...cues, ...(extra[q.id] ?? [])];
  const hit = words.some((w) => mentions(text, w));
  if (!hit) return undefined;
  // Respect explicit negation right before the cue ("no garden", "without sea").
  const negated = words.some((w) =>
    new RegExp(`\\b(no|without|not|don'?t need)\\s+(a\\s+)?${escapeRe(w)}`, "i").test(text),
  );
  return !negated;
}

function mentions(text: string, phrase: string): boolean {
  const p = phrase.toLowerCase().trim();
  if (!p) return false;
  return new RegExp(`\\b${escapeRe(p)}`, "i").test(text);
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

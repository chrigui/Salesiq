import type { IndustryPack } from "@/core/types";
import type { ScoredItem } from "./scoring";
import { formatMoney } from "./explain";
import type { KnowledgeFact } from "./proposal";
import { toneDirective, knowledgeOnlyDirective, type AiSettingsShape } from "@/core/data/aiSettings";

export const COMMON_OBJECTIONS = [
  "It's too expensive",
  "I need to think about it",
  "I want to compare other options",
  "I'm not sure this is the right fit",
] as const;

/** Remove a leading "it " so a reason reads as a clause in a sentence. */
function stripIt(reason: string): string {
  return reason.replace(/^it\s+/i, "");
}

/**
 * Objection Handler (Module 6 · AI Engine).
 *
 * A salesperson enters or picks a customer objection mid-conversation and
 * gets a response grounded in the current recommendation's verified facts
 * plus the tenant's Knowledge Base — never a generic sales script.
 * Deterministic by default (works offline, instant); the API route asks
 * Claude for a sharper, tenant-tuned response from the exact same facts when
 * ANTHROPIC_API_KEY is set, always falling back to this responder on error.
 */
export function respondToObjection(
  objection: string,
  scored: ScoredItem | undefined,
  knowledge: KnowledgeFact[] = [],
): string {
  if (!scored) {
    return "Answer a few questions first so the response can point to a specific recommendation.";
  }
  const { item, reasons } = scored;
  const price = formatMoney(item.price, item.currency);
  const topReason = reasons[0] ? stripIt(reasons[0]) : null;
  const text = objection.toLowerCase();

  if (/expensive|cost|price|afford|budget/.test(text)) {
    const kb = knowledge.find((k) => /financ/i.test(k.title))?.content;
    return [
      `I hear you — ${price} is a real number.`,
      topReason
        ? `Keep in mind ${item.name} ${topReason}, which is exactly what you told us mattered most.`
        : null,
      kb ?? null,
      `Would it help to look at the numbers together, or see how it compares to the alternatives?`,
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (/think|time|decide|not ready|later/.test(text)) {
    return [
      `Of course — this is a big decision.`,
      topReason
        ? `While you're weighing it, ${item.name} ${topReason}, so it should hold up well against whatever else you're considering.`
        : null,
      `Is there a specific question I can answer right now that would make the decision easier?`,
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (/compare|other option|look around|shop|elsewhere/.test(text)) {
    return [
      `Absolutely, it's worth comparing.`,
      topReason
        ? `Just make sure whatever you compare against also ${topReason} — that's the part that matched what you asked for.`
        : null,
      `I'm happy to send over a side-by-side if that helps.`,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    `That's a fair point.`,
    topReason
      ? `${item.name} ${topReason}, which is why we recommended it — but I want to make sure it actually fits what you need.`
      : `${item.name} is still a strong option at ${price}.`,
    `What specifically is holding you back?`,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * The prompt sent to Claude in place of the deterministic responder above.
 * Every fact it's allowed to use comes from the scoring breakdown and the
 * tenant's own Knowledge Base — nothing invented.
 */
export function buildObjectionPrompt(
  objection: string,
  scored: ScoredItem | undefined,
  pack: IndustryPack,
  knowledge: KnowledgeFact[] = [],
  settings?: AiSettingsShape,
): string {
  const facts = scored
    ? scored.breakdown
        .filter((b) => b.reason)
        .map((b) => `- ${b.reason}`)
        .join("\n")
    : "(no recommendation yet)";
  const kbBlock = knowledge.length
    ? knowledge.map((k) => `- ${k.title}: ${k.content}`).join("\n")
    : "(none provided)";
  const itemLine = scored
    ? `${scored.item.name} at ${formatMoney(scored.item.price, scored.item.currency)}`
    : "no item yet";

  return [
    `You are a sales advisor at ${pack.branding.name}, a ${pack.vertical} business, currently recommending ${itemLine}.`,
    `The customer just said: "${objection}"`,
    `Write a short, confident, empathetic response (2-3 sentences, plain text, no markdown) that addresses this objection.`,
    settings ? toneDirective(settings) : null,
    `Only use these verified facts — never invent numbers or promises:`,
    facts,
    `You may also draw on these company facts if relevant, quoting them accurately and only if they apply:`,
    kbBlock,
    settings ? knowledgeOnlyDirective(settings) : null,
    `End with a question that moves the conversation forward.`,
  ]
    .filter(Boolean)
    .join("\n");
}

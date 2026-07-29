import type { IndustryPack } from "@/core/types";
import type { ScoredItem } from "./scoring";
import { formatMoney } from "./explain";
import { toneDirective, knowledgeOnlyDirective, type AiSettingsShape } from "@/core/data/aiSettings";

export interface KnowledgeFact {
  title: string;
  content: string;
}

/**
 * Proposal Writer (Module 6 · AI Engine).
 *
 * Upgrades the single-sentence `narrate()` into a full, multi-paragraph
 * proposal grounded in the same verified scoring facts, optionally quoting
 * tenant Knowledge Base entries. Deterministic by default (works offline,
 * instant); the API route asks Claude for richer prose from these exact
 * facts when ANTHROPIC_API_KEY is set (see `buildProposalPrompt`), always
 * falling back to this writer on any error.
 */
export function writeProposal(
  scored: ScoredItem,
  pack: IndustryPack,
  customerName: string,
  knowledge: KnowledgeFact[] = [],
): string {
  const { item, reasons } = scored;
  const price = formatMoney(item.price, item.currency);
  const name = customerName || "there";

  const paragraphs: string[] = [
    `Hi ${name}, thank you for taking the time to tell us what you're looking for. Based on everything you shared, we're confident that ${item.name} is the right fit for you.`,
  ];

  paragraphs.push(
    reasons.length
      ? `${item.name} stands out because ${reasons
          .slice(0, 4)
          .map(stripIt)
          .join(", ")}. At ${price}, it sits comfortably within the range you set.`
      : `${item.name} is a strong all-round choice at ${price}.`,
  );

  if (item.highlights.length) {
    paragraphs.push(`A few more things worth knowing: ${item.highlights.join("; ")}.`);
  }

  if (knowledge.length) {
    paragraphs.push(knowledge.slice(0, 2).map((k) => k.content).join(" "));
  }

  paragraphs.push(
    "We'd love to move forward whenever you're ready — just reply to this message or give us a call and we'll take care of the rest.",
  );

  return paragraphs.join("\n\n");
}

/** Remove a leading "it " so a reason reads as a clause in a sentence. */
function stripIt(reason: string): string {
  return reason.replace(/^it\s+/i, "");
}

/**
 * The prompt sent to Claude in place of the deterministic writer above. Kept
 * here so the seam is explicit and reviewable — every fact it's allowed to
 * use comes straight from the scoring breakdown and the tenant's own
 * Knowledge Base, nothing else.
 */
export function buildProposalPrompt(
  scored: ScoredItem,
  pack: IndustryPack,
  customerName: string,
  knowledge: KnowledgeFact[] = [],
  settings?: AiSettingsShape,
): string {
  const facts = scored.breakdown
    .filter((b) => b.reason)
    .map((b) => `- ${b.reason}`)
    .join("\n");
  const kbBlock = knowledge.length
    ? knowledge.map((k) => `- ${k.title}: ${k.content}`).join("\n")
    : "(none provided)";

  return [
    `You are a sales advisor at ${pack.branding.name}, a ${pack.vertical} business.`,
    `Write a sales proposal (3-4 short paragraphs, plain text, no markdown, no subject line) for ${
      customerName || "the customer"
    } recommending "${scored.item.name}" at ${formatMoney(scored.item.price, scored.item.currency)}.`,
    settings ? toneDirective(settings) : null,
    `Start with "Hi ${customerName || "there"},". Only use these verified facts — never invent numbers or promises:`,
    facts || "(no specific match reasons recorded)",
    ``,
    `You may also draw on these company facts if relevant, quoting them accurately and only if they apply:`,
    kbBlock,
    settings ? knowledgeOnlyDirective(settings) : null,
    ``,
    `End with a friendly call to action.`,
  ]
    .filter(Boolean)
    .join("\n");
}

import type { IndustryPack } from "@/core/types";
import { formatMoney } from "./explain";
import type { KnowledgeFact } from "./proposal";
import { toneDirective, knowledgeOnlyDirective, type AiSettingsShape } from "@/core/data/aiSettingsShared";

export const EMAIL_PURPOSES = [
  { id: "first-followup", label: "First follow-up" },
  { id: "check-in", label: "Checking in" },
  { id: "re-engage", label: "Re-engagement" },
  { id: "thank-you", label: "Thank you" },
] as const;

export type EmailPurpose = (typeof EMAIL_PURPOSES)[number]["id"];

export interface EmailDraft {
  subject: string;
  body: string;
}

export interface EmailLeadFacts {
  customerName: string;
  itemName: string;
  price: number;
  currency: string;
  notes: string;
}

/**
 * Email Generator (Module 6 · AI Engine).
 *
 * Drafts a follow-up email for a saved lead — outreach cadence after the
 * fact, distinct from the Proposal Writer's point-of-sale letter. Purpose
 * picks the angle (first nudge, check-in, re-engagement, thank-you).
 * Deterministic templates by default; the API route asks Claude for
 * tenant-tuned prose from the same verified lead facts and Knowledge Base
 * entries when ANTHROPIC_API_KEY is set, always falling back to these
 * templates on any error.
 */
export function draftEmail(
  purpose: EmailPurpose,
  lead: EmailLeadFacts,
  knowledge: KnowledgeFact[] = [],
): EmailDraft {
  const name = lead.customerName || "there";
  const price = formatMoney(lead.price, lead.currency);
  const kb = knowledge.length ? ` ${knowledge[0].content}` : "";

  switch (purpose) {
    case "check-in":
      return {
        subject: "Just checking in",
        body: `Hi ${name},\n\nIt's been a little while since we spoke about ${lead.itemName}, so I wanted to check in and see where things stand on your end.${kb}\n\nNo pressure at all — just here whenever you're ready to pick things back up.`,
      };
    case "re-engage":
      return {
        subject: `Still interested in ${lead.itemName}?`,
        body: `Hi ${name},\n\nI know things get busy — I didn't want ${lead.itemName} (${price}) to slip through the cracks. It's still available and still checks the boxes you mentioned.${kb}\n\nWould it help to hop on a quick call this week?`,
      };
    case "thank-you":
      return {
        subject: "Thank you!",
        body: `Hi ${name},\n\nThank you for the time you spent with us discussing ${lead.itemName}. It was a pleasure getting to know what you're looking for.${kb}\n\nWe're here whenever you're ready for the next step.`,
      };
    case "first-followup":
    default:
      return {
        subject: `Following up — ${lead.itemName}`,
        body: `Hi ${name},\n\nI wanted to follow up on ${lead.itemName} (${price}) that we discussed. It's still a great match for what you told us you're after, and I'd love to help you take the next step.${kb}\n\nLet me know if you have any questions — happy to jump on a call whenever suits you.`,
      };
  }
}

/**
 * The prompt sent to Claude in place of the deterministic templates above.
 * Every fact it's allowed to use comes from the lead record itself and the
 * tenant's own Knowledge Base — nothing invented.
 */
export function buildEmailPrompt(
  purpose: EmailPurpose,
  pack: IndustryPack,
  lead: EmailLeadFacts,
  knowledge: KnowledgeFact[] = [],
  settings?: AiSettingsShape,
): string {
  const kbBlock = knowledge.length
    ? knowledge.map((k) => `- ${k.title}: ${k.content}`).join("\n")
    : "(none provided)";
  const purposeLabel = EMAIL_PURPOSES.find((p) => p.id === purpose)?.label ?? purpose;

  return [
    `You are a sales advisor at ${pack.branding.name}, a ${pack.vertical} business.`,
    `Write a short follow-up email (subject line + 2-3 short paragraph body, plain text, no markdown) to ${
      lead.customerName || "the customer"
    }.`,
    `Purpose: ${purposeLabel}.`,
    settings ? toneDirective(settings) : null,
    `Facts you may reference — never invent numbers or promises beyond these:`,
    `- Item discussed: ${lead.itemName} at ${formatMoney(lead.price, lead.currency)}`,
    lead.notes ? `- Notes from the salesperson: ${lead.notes}` : "",
    `Company facts you may draw on if relevant, quoting them accurately and only if they apply:`,
    kbBlock,
    settings ? knowledgeOnlyDirective(settings) : null,
    ``,
    `Respond with only a single JSON object: {"subject": "...", "body": "..."}`,
  ]
    .filter(Boolean)
    .join("\n");
}

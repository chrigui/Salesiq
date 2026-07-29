import { NextResponse } from "next/server";
import { getPack } from "@/core/industries";
import {
  draftEmail,
  buildEmailPrompt,
  EMAIL_PURPOSES,
  type EmailPurpose,
  type EmailLeadFacts,
} from "@/core/engine/email";
import type { KnowledgeFact } from "@/core/engine/proposal";
import type { IndustryPack } from "@/core/types";

/**
 * Email Generator endpoint.
 *
 * POST { packId, purpose, customerName, itemName, price, currency, notes,
 * knowledge } -> a subject + body follow-up email for a saved lead.
 *
 * Deterministic templates by default (core/engine/email.ts); Claude-authored
 * from the exact same verified lead facts and Knowledge Base entries when
 * ANTHROPIC_API_KEY is set, with a graceful fallback to the template on any
 * error or malformed response.
 */
export async function POST(request: Request) {
  let body: {
    packId?: string;
    purpose?: string;
    customerName?: string;
    itemName?: string;
    price?: number;
    currency?: string;
    notes?: string;
    knowledge?: KnowledgeFact[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const pack = getPack(body.packId);
  const purpose: EmailPurpose =
    (EMAIL_PURPOSES.find((p) => p.id === body.purpose)?.id as EmailPurpose | undefined) ??
    "first-followup";
  const lead: EmailLeadFacts = {
    customerName: (body.customerName ?? "").trim(),
    itemName: body.itemName ?? "your selection",
    price: typeof body.price === "number" ? body.price : 0,
    currency: body.currency ?? pack.currency,
    notes: (body.notes ?? "").trim(),
  };
  const knowledge = Array.isArray(body.knowledge) ? body.knowledge.slice(0, 6) : [];

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const draft = await draftWithClaude(purpose, pack, lead, knowledge);
      return NextResponse.json({ ...draft, engine: "claude+email" });
    } catch (err) {
      console.error("Claude email draft failed, using deterministic templates:", err);
    }
  }

  const draft = draftEmail(purpose, lead, knowledge);
  return NextResponse.json({ ...draft, engine: "deterministic-email" });
}

async function draftWithClaude(
  purpose: EmailPurpose,
  pack: IndustryPack,
  lead: EmailLeadFacts,
  knowledge: KnowledgeFact[],
): Promise<{ subject: string; body: string }> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 500,
    messages: [{ role: "user", content: buildEmailPrompt(purpose, pack, lead, knowledge) }],
  });

  const text = message.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object in Claude email response");
  const parsed = JSON.parse(match[0]) as { subject?: string; body?: string };
  if (!parsed.subject || !parsed.body) throw new Error("Incomplete email draft from Claude");
  return { subject: parsed.subject, body: parsed.body };
}

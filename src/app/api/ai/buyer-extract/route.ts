import { NextResponse } from "next/server";
import { requireSession, AuthError } from "@/lib/auth/server";
import {
  buildBuyerExtractionPrompt,
  coerceExtraction,
  deterministicExtract,
  type BuyerExtraction,
} from "@/core/buyerIntelligence/conversationExtraction";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * "Describe the customer" for Buyer Intelligence (spec §10) — extracts into
 * a BuyerProfile's field set, not a pack's Answers (that's /api/ai/search).
 * Session-authenticated, no capability gate (matches saving a lead — any
 * salesperson can describe their own conversation). Claude-authored when
 * ANTHROPIC_API_KEY is set, deterministic keyword fallback otherwise —
 * either way the result is a *proposal* only: nothing is written to any
 * BuyerProfile here. The caller must still confirm/edit/reject via
 * POST /api/buyer-profiles/[id]/conversation-notes before anything sticks.
 */
export async function POST(request: Request) {
  try {
    await requireSession();
    const body = await request.json().catch(() => null);
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) {
      return NextResponse.json({ error: "empty-text" }, { status: 400 });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const raw = await extractWithClaude(text);
        const extracted = coerceExtraction(raw);
        if (Object.keys(extracted).length > 0) {
          return NextResponse.json({ extracted, engine: "claude+writer" });
        }
      } catch (err) {
        console.error("Claude buyer extraction failed, using keyword fallback:", err);
      }
    }

    const extracted = coerceExtraction(deterministicExtract(text));
    return NextResponse.json({ extracted, engine: "deterministic-writer" });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

async function extractWithClaude(text: string): Promise<BuyerExtraction> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 500,
    messages: [{ role: "user", content: buildBuyerExtractionPrompt(text) }],
  });

  const responseText = message.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  const match = responseText.match(/\{[\s\S]*\}/);
  if (!match) return {};
  return JSON.parse(match[0]) as BuyerExtraction;
}

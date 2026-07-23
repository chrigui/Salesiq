import { NextResponse } from "next/server";
import { getPack } from "@/core/industries";
import { scoreInventory, type ScoredItem } from "@/core/engine/scoring";
import { narrate, buildNarrationPrompt } from "@/core/engine/explain";
import type { Answers, IndustryPack } from "@/core/types";

/**
 * AI Decision Engine endpoint.
 *
 * POST { packId, answers } -> ranked, self-explaining recommendations.
 *
 * Scoring and ranking are always deterministic (works offline, zero latency,
 * fully auditable). When ANTHROPIC_API_KEY is set, the *narrative prose* for
 * the top recommendation is authored by Claude from the engine's own verified
 * reasons (`buildNarrationPrompt`) — so it reads richer but can never invent a
 * fact the engine didn't establish. Without a key, or on any error, it falls
 * back to the deterministic narrator. The UI is identical either way.
 */
export async function POST(request: Request) {
  let body: { packId?: string; answers?: Answers };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const pack = getPack(body.packId);
  const answers = body.answers ?? {};
  const scored = scoreInventory(pack, answers);

  // Only the headline recommendation gets LLM prose (latency + cost); the rest
  // stay deterministic. Gated on the key with a graceful fallback.
  let claudeNarrative: string | null = null;
  let engine = "deterministic-scoring";
  if (process.env.ANTHROPIC_API_KEY && scored[0]) {
    try {
      claudeNarrative = await narrateWithClaude(scored[0], pack);
      engine = "claude+scoring";
    } catch (err) {
      console.error("Claude narration failed, using deterministic narrator:", err);
    }
  }

  const recommendations = scored.slice(0, 5).map((s, i) => ({
    id: s.item.id,
    name: s.item.name,
    subtitle: s.item.subtitle,
    price: s.item.price,
    currency: s.item.currency,
    score: s.score,
    reasons: s.reasons,
    narrative: i === 0 && claudeNarrative ? claudeNarrative : narrate(s, pack),
  }));

  return NextResponse.json({
    packId: pack.id,
    vertical: pack.vertical,
    engine,
    recommendations,
  });
}

/** Author the top recommendation's narrative with Claude from verified facts. */
async function narrateWithClaude(
  scored: ScoredItem,
  pack: IndustryPack,
): Promise<string> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 400,
    messages: [{ role: "user", content: buildNarrationPrompt(scored, pack) }],
  });

  const text = message.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();

  if (!text) throw new Error("Empty narration from Claude");
  return text;
}

import { NextResponse } from "next/server";
import { getPack } from "@/core/industries";
import { scoreInventory, type ScoredItem } from "@/core/engine/scoring";
import { writeProposal, buildProposalPrompt, type KnowledgeFact } from "@/core/engine/proposal";
import { resolveAiSettings, type AiSettingsShape } from "@/core/data/aiSettingsShared";
import type { Answers, IndustryPack } from "@/core/types";

/**
 * Proposal Writer endpoint.
 *
 * POST { packId, answers, customerName, knowledge } -> a full, multi-paragraph
 * proposal for the top recommendation.
 *
 * The top recommendation itself is always the deterministic scoring engine's
 * (identical to /api/ai/recommend); only the prose is optionally authored by
 * Claude from the engine's own verified reasons plus the tenant's Knowledge
 * Base entries, gated on ANTHROPIC_API_KEY, with a graceful deterministic
 * fallback on any error.
 */
export async function POST(request: Request) {
  let body: {
    packId?: string;
    answers?: Answers;
    customerName?: string;
    knowledge?: KnowledgeFact[];
    settings?: Partial<AiSettingsShape>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const pack = getPack(body.packId);
  const answers = body.answers ?? {};
  const customerName = (body.customerName ?? "").trim();
  const settings = resolveAiSettings(body.settings);
  const knowledge = Array.isArray(body.knowledge)
    ? body.knowledge.slice(0, settings.maxKnowledgeFacts)
    : [];

  const scored = scoreInventory(pack, answers);
  const best = scored[0];
  if (!best) {
    return NextResponse.json({ error: "No inventory to recommend" }, { status: 400 });
  }

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const proposal = await writeWithClaude(best, pack, customerName, knowledge, settings);
      return NextResponse.json({
        proposal,
        engine: "claude+writer",
        itemId: best.item.id,
        itemName: best.item.name,
      });
    } catch (err) {
      console.error("Claude proposal failed, using deterministic writer:", err);
    }
  }

  const proposal = writeProposal(best, pack, customerName, knowledge);
  return NextResponse.json({
    proposal,
    engine: "deterministic-writer",
    itemId: best.item.id,
    itemName: best.item.name,
  });
}

async function writeWithClaude(
  scored: ScoredItem,
  pack: IndustryPack,
  customerName: string,
  knowledge: KnowledgeFact[],
  settings: AiSettingsShape,
): Promise<string> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 700,
    temperature: settings.creativity,
    messages: [
      { role: "user", content: buildProposalPrompt(scored, pack, customerName, knowledge, settings) },
    ],
  });

  const text = message.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();

  if (!text) throw new Error("Empty proposal from Claude");
  return text;
}

import { NextResponse } from "next/server";
import { getPack } from "@/core/industries";
import { scoreInventory } from "@/core/engine/scoring";
import { respondToObjection, buildObjectionPrompt } from "@/core/engine/objection";
import type { KnowledgeFact } from "@/core/engine/proposal";
import { resolveAiSettings, type AiSettingsShape } from "@/core/data/aiSettings";
import type { Answers, IndustryPack } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";

/**
 * Objection Handler endpoint.
 *
 * POST { packId, answers, objection, knowledge } -> a response to the
 * customer's objection, grounded in the current top recommendation's
 * verified facts (identical scoring as /api/ai/recommend) plus the
 * tenant's Knowledge Base.
 *
 * Deterministic by default (core/engine/objection.ts); Claude-authored from
 * the exact same facts when ANTHROPIC_API_KEY is set, with a graceful
 * fallback to the deterministic responder on any error.
 */
export async function POST(request: Request) {
  let body: {
    packId?: string;
    answers?: Answers;
    objection?: string;
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
  const objection = (body.objection ?? "").trim();
  const settings = resolveAiSettings(body.settings);
  const knowledge = Array.isArray(body.knowledge)
    ? body.knowledge.slice(0, settings.maxKnowledgeFacts)
    : [];

  if (!objection) {
    return NextResponse.json({ error: "Empty objection" }, { status: 400 });
  }

  const scored = scoreInventory(pack, answers);
  const best = scored[0];

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await respondWithClaude(objection, best, pack, knowledge, settings);
      return NextResponse.json({ response, engine: "claude+objection" });
    } catch (err) {
      console.error("Claude objection response failed, using deterministic responder:", err);
    }
  }

  const response = respondToObjection(objection, best, knowledge);
  return NextResponse.json({ response, engine: "deterministic-objection" });
}

async function respondWithClaude(
  objection: string,
  scored: ScoredItem | undefined,
  pack: IndustryPack,
  knowledge: KnowledgeFact[],
  settings: AiSettingsShape,
): Promise<string> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 400,
    temperature: settings.creativity,
    messages: [
      { role: "user", content: buildObjectionPrompt(objection, scored, pack, knowledge, settings) },
    ],
  });

  const text = message.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();

  if (!text) throw new Error("Empty objection response from Claude");
  return text;
}

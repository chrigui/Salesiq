import { NextResponse } from "next/server";
import { getBasePack, PACKS_BY_ID } from "@/core/industries";
import { writeBrochureCopy, buildBrochureCopyPrompt, type BrochureCopyResult, type BrochureCopy } from "@/core/engine/brochureCopy";
import { resolveAiSettings, type AiSettingsShape } from "@/core/data/aiSettingsShared";
import type { InventoryItem, IndustryPack } from "@/core/types";

/**
 * Brochure Copy endpoint.
 *
 * POST { packId, itemId, settings? } -> English brochure copy, always; an
 * Arabic translation of that same copy only when ANTHROPIC_API_KEY is set —
 * Claude only ever polishes/translates the item's real facts, never invents
 * specs. No key -> `ar: null` with an `engine` field the UI uses to show an
 * honest "Arabic translation requires an AI key" note, never a fake
 * fallback translation.
 */
export async function POST(request: Request) {
  let body: { packId?: string; itemId?: string; settings?: Partial<AiSettingsShape> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.packId || !PACKS_BY_ID[body.packId]) {
    return NextResponse.json({ error: "unknown-pack" }, { status: 404 });
  }
  const pack = getBasePack(body.packId);
  const item = pack.inventory.find((i) => i.id === body.itemId);
  if (!item) {
    return NextResponse.json({ error: "unknown-item" }, { status: 404 });
  }
  const settings = resolveAiSettings(body.settings);

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const result = await writeWithClaude(item, pack, settings);
      return NextResponse.json({ ...result, engine: "claude+writer" });
    } catch (err) {
      console.error("Claude brochure copy failed, using deterministic writer:", err);
    }
  }

  const en = writeBrochureCopy(item);
  const result: BrochureCopyResult = { en, ar: null };
  return NextResponse.json({ ...result, engine: "deterministic-writer" });
}

async function writeWithClaude(
  item: InventoryItem,
  pack: IndustryPack,
  settings: AiSettingsShape,
): Promise<BrochureCopyResult> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 700,
    temperature: settings.creativity,
    messages: [{ role: "user", content: buildBrochureCopyPrompt(item, pack, settings) }],
  });

  const text = message.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object in Claude brochure response");
  const parsed = JSON.parse(match[0]) as {
    summary?: string;
    highlights?: string[];
    arabic?: { summary?: string; highlights?: string[] };
  };
  if (!parsed.summary || !parsed.highlights) throw new Error("Incomplete brochure copy from Claude");

  const en: BrochureCopy = { summary: parsed.summary, highlights: parsed.highlights };
  const ar: BrochureCopy | null =
    parsed.arabic?.summary && parsed.arabic?.highlights
      ? { summary: parsed.arabic.summary, highlights: parsed.arabic.highlights }
      : null;

  return { en, ar };
}

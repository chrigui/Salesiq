import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { getBasePack } from "@/core/industries";
import {
  buildDisplayDesignPrompt,
  coerceDisplayDesign,
  deterministicDisplayDesign,
  type DisplayDesignResult,
} from "@/core/engine/displayProfileDesign";
import { resolveAiSettings, type AiSettingsShape } from "@/core/data/aiSettingsShared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  profileId: z.string().min(1).max(100),
  settings: z.record(z.string(), z.unknown()).optional(),
  intent: z.string().max(500).optional(),
});

/**
 * AI Display Design Assistant — proposes a widget composition + motion
 * style for an existing draft profile, from the item's real data only
 * (never inventing facts, only deciding structure). Claude-authored when
 * ANTHROPIC_API_KEY is set, tagged "claude+writer"; a deterministic
 * heuristic fallback otherwise, tagged "deterministic-writer". Either way
 * this route only ever returns a *proposal* — it never writes to the
 * profile itself; the editor requires an explicit "Apply to draft" before
 * anything is saved, and applying never publishes.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireCapability("display-studio.manage");
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }

    const profile = await prisma.displayProfile.findFirst({
      where: { id: parsed.data.profileId, tenantId: ctx.tenantId },
      include: { assets: { select: { name: true, mimeType: true } } },
    });
    if (!profile) return NextResponse.json({ error: "not-found" }, { status: 404 });

    const pack = getBasePack(profile.packId);
    const item = pack.inventory.find((i) => i.id === profile.itemId);
    if (!item) return NextResponse.json({ error: "unknown-item" }, { status: 404 });

    const settings = resolveAiSettings(parsed.data.settings as Partial<AiSettingsShape> | undefined);
    const assets = profile.assets.map((a) => ({ name: a.name, mimeType: a.mimeType }));

    const intent = parsed.data.intent;

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const result = await designWithClaude(item, pack, assets, settings, intent);
        if (result) return NextResponse.json({ ...result, engine: "claude+writer" });
      } catch (err) {
        console.error("Claude display design failed, using deterministic writer:", err);
      }
    }

    const result = deterministicDisplayDesign(item, pack, assets, intent);
    return NextResponse.json({ ...result, engine: "deterministic-writer" });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

async function designWithClaude(
  item: Parameters<typeof buildDisplayDesignPrompt>[0],
  pack: Parameters<typeof buildDisplayDesignPrompt>[1],
  assets: Parameters<typeof buildDisplayDesignPrompt>[2],
  settings: AiSettingsShape,
  intent?: string,
): Promise<DisplayDesignResult | null> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 700,
    temperature: settings.creativity,
    messages: [{ role: "user", content: buildDisplayDesignPrompt(item, pack, assets, settings, intent) }],
  });

  const text = message.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object in Claude display design response");
  const parsed = JSON.parse(match[0]);
  return coerceDisplayDesign(parsed);
}

import { NextResponse } from "next/server";
import {
  buildWizardPrompt,
  coercePackContent,
  generateTemplatePack,
  type WizardPackContent,
} from "@/core/engine/wizard";
import { resolveAiSettings, type AiSettingsShape } from "@/core/data/aiSettingsShared";

/**
 * Smart Wizard endpoint.
 *
 * POST { description, label, vertical, currency, settings } -> a full set of
 * questions, sample inventory and scoring rules for the pack — "10 minutes
 * until the client meeting" turned into a working demo.
 *
 * Claude-authored from the tenant's one-line business description when
 * ANTHROPIC_API_KEY is set; a deterministic generic starter template
 * otherwise. Either path is run through `coercePackContent` before it's
 * returned, so a malformed or invented AI response can never corrupt the
 * pack or reference a question/attribute that doesn't exist.
 */
export async function POST(request: Request) {
  let body: {
    description?: string;
    label?: string;
    vertical?: string;
    currency?: string;
    settings?: Partial<AiSettingsShape>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const description = (body.description ?? "").trim();
  const label = (body.label ?? "This business").trim();
  const vertical = (body.vertical ?? "general").trim();
  const currency = (body.currency ?? "USD").trim();
  const settings = resolveAiSettings(body.settings);

  if (!description) {
    return NextResponse.json({ error: "Empty description" }, { status: 400 });
  }

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const pack = await generateWithClaude(description, { label, vertical, currency }, settings);
      return NextResponse.json({ pack, engine: "claude+wizard" });
    } catch (err) {
      console.error("Claude wizard generation failed, using template pack:", err);
    }
  }

  const pack = generateTemplatePack({ label, currency });
  return NextResponse.json({ pack, engine: "template" });
}

async function generateWithClaude(
  description: string,
  opts: { label: string; vertical: string; currency: string },
  settings: AiSettingsShape,
): Promise<WizardPackContent> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 3000,
    temperature: settings.creativity,
    messages: [{ role: "user", content: buildWizardPrompt(description, opts) }],
  });

  const text = message.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object in Claude wizard response");
  const raw = JSON.parse(match[0]);
  return coercePackContent(raw, opts);
}

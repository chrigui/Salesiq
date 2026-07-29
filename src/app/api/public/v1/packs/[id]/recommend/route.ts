import { NextResponse } from "next/server";
import { getBasePack, PACKS_BY_ID } from "@/core/industries";
import { scoreInventory } from "@/core/engine/scoring";
import { narrate } from "@/core/engine/explain";
import type { Answers } from "@/core/types";

/**
 * Public API (Module 12 · Future Platform).
 *
 * POST /api/public/v1/packs/{id}/recommend
 * Body: { answers: { [questionId]: value } }
 * -> the same ranked, self-explaining recommendations the companion shows,
 * computed by the real Decision Engine — this is the actual scoring code,
 * not a mock response for the docs page.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!PACKS_BY_ID[id]) {
    return NextResponse.json(
      { error: `Unknown pack "${id}". GET /api/public/v1/packs for the list of shipped packs.` },
      { status: 404 },
    );
  }

  let body: { answers?: Answers };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const pack = getBasePack(id);
  const answers = body.answers ?? {};
  const scored = scoreInventory(pack, answers);

  const recommendations = scored.slice(0, 5).map((s) => ({
    id: s.item.id,
    name: s.item.name,
    subtitle: s.item.subtitle,
    price: s.item.price,
    currency: s.item.currency,
    score: s.score,
    reasons: s.reasons,
    narrative: narrate(s, pack),
  }));

  return NextResponse.json({ packId: pack.id, recommendations });
}

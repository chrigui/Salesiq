import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { resolvePublicSharedExperience } from "@/lib/sharedExperiences/resolve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const eventSchema = z.object({
  kind: z.enum(["View", "ItemClick", "ProposalView"]),
  meta: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Public, unauthenticated — real analytics only, same pattern as the
 * Brochure module's events route. Called via navigator.sendBeacon from the
 * short-link page on load (View, and ProposalView when a proposal is
 * present) and on every item card click (ItemClick).
 */
export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const resolved = await resolvePublicSharedExperience(code);
  if (!resolved) return NextResponse.json({ error: "not-found" }, { status: 404 });

  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid-request" }, { status: 400 });
  }

  await prisma.sharedExperienceEvent.create({
    data: {
      sharedExperienceId: resolved.sharedExperienceId,
      tenantId: resolved.tenantId,
      kind: parsed.data.kind,
      meta: (parsed.data.meta as Prisma.InputJsonValue | undefined) ?? undefined,
    },
  });

  return NextResponse.json({ ok: true });
}

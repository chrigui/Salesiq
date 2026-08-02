import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { resolvePublicBrochure } from "@/lib/brochures/resolve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const eventSchema = z.object({
  kind: z.enum(["View", "Scan", "Click"]),
  meta: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Public, unauthenticated — real analytics only. Called via
 * navigator.sendBeacon from the microsite on load (View/Scan) and on every
 * outbound share-button click (Click). No count here is fabricated; a
 * brochure with zero real visits shows zero.
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolved = await resolvePublicBrochure(slug);
  if (!resolved) return NextResponse.json({ error: "not-found" }, { status: 404 });

  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid-request" }, { status: 400 });
  }

  await prisma.brochureEvent.create({
    data: {
      brochureId: resolved.brochureId,
      tenantId: resolved.tenantId,
      kind: parsed.data.kind,
      meta: (parsed.data.meta as Prisma.InputJsonValue | undefined) ?? undefined,
    },
  });

  return NextResponse.json({ ok: true });
}

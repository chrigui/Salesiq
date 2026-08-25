import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Unauthenticated by design — the live Customer Display, its /continue
 * phone continuation, and DisplayProfileRenderer's public asset chain all
 * need a brand kit's logo with no login of their own, same trust model as
 * the Display Profile public asset route: id is an opaque cuid, not
 * guessable. A BrandProfile has no Draft/Published lifecycle to gate on —
 * once a kit exists it's a reusable asset any of its profiles can render.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const brandProfile = await prisma.brandProfile.findFirst({
    where: { id },
    select: { logoData: true, logoMimeType: true },
  });
  if (!brandProfile?.logoData || !brandProfile.logoMimeType) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(brandProfile.logoData), {
    headers: { "Content-Type": brandProfile.logoMimeType },
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Unauthenticated by design — the live Customer Display (and a claimed
 * kiosk's idle poll) render a Published profile's assets with no login of
 * their own, same as the resolve/config routes. Only serves assets for
 * Published profiles, and only their own — profileId + assetId are both
 * opaque cuids, not guessable, same trust model as a Brochure asset link.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; assetId: string }> },
) {
  const { id, assetId } = await params;

  const profile = await prisma.displayProfile.findFirst({
    where: { id, status: "Published" },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "not-found" }, { status: 404 });

  const asset = await prisma.displayProfileAsset.findFirst({ where: { id: assetId, profileId: id } });
  if (!asset) return NextResponse.json({ error: "not-found" }, { status: 404 });

  return new NextResponse(new Uint8Array(asset.data), {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(asset.name)}"`,
    },
  });
}

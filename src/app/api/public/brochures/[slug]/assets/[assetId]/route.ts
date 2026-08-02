import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolvePublicBrochure } from "@/lib/brochures/resolve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public download for a Document Center attachment — only ever served once the brochure itself is Published. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; assetId: string }> },
) {
  const { slug, assetId } = await params;
  const resolved = await resolvePublicBrochure(slug);
  if (!resolved) return NextResponse.json({ error: "not-found" }, { status: 404 });

  const asset = await prisma.brochureAsset.findFirst({
    where: { id: assetId, brochureId: resolved.brochureId },
  });
  if (!asset) return NextResponse.json({ error: "not-found" }, { status: 404 });

  return new NextResponse(new Uint8Array(asset.data), {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(asset.name)}"`,
    },
  });
}

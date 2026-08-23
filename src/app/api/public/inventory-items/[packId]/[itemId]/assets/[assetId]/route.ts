import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Unauthenticated by design — an uploaded image asset can end up in an
 * item's `gallery` (see InventoryBuilder's upload flow), and that gallery
 * renders on the public Brochure microsite and the unauthenticated Customer
 * Display, same as every other inventory image URL. Inventory data itself
 * has no draft/published distinction to gate on (unlike Brochure/
 * DisplayProfile) — it's product-catalog data, already public via
 * /api/public/v1/packs. packId/itemId/assetId together are the same trust
 * boundary as a Brochure asset link: opaque, not guessable.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ packId: string; itemId: string; assetId: string }> },
) {
  const { packId, itemId, assetId } = await params;
  const asset = await prisma.inventoryItemAsset.findFirst({ where: { id: assetId, packId, itemId } });
  if (!asset) return NextResponse.json({ error: "not-found" }, { status: 404 });

  return new NextResponse(new Uint8Array(asset.data), {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(asset.name)}"`,
    },
  });
}

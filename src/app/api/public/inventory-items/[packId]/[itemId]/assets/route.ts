import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Unauthenticated by design, mirroring the sibling public per-asset route
 * (`[assetId]/route.ts`) — the Customer Display is often an unauthenticated
 * kiosk (see CLAUDE.md's Display device identity notes) and cannot call
 * the capability-gated `/api/inventory-items/[packId]/[itemId]/assets`, but
 * still needs to discover which real floor-plan/payment/gallery documents
 * exist for the Decision Room's Investment/Floor Plan/Payment modes.
 * Inventory data has no draft/published distinction to gate on (unlike
 * Brochure/DisplayProfile) — packId/itemId together are the same trust
 * boundary the per-asset download route already relies on: opaque, not
 * guessable. Metadata only (no file bytes) — same shape as the
 * authenticated list route, minus the tenant scoping it doesn't need here.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ packId: string; itemId: string }> },
) {
  const { packId, itemId } = await params;

  const assets = await prisma.inventoryItemAsset.findMany({
    where: { packId, itemId },
    select: { id: true, name: true, mimeType: true, sizeBytes: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ assets: assets.map((a) => ({ ...a, createdAt: a.createdAt.getTime() })) });
}

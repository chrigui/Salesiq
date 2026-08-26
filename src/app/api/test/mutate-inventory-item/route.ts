import { NextResponse } from "next/server";
import { z } from "zod";
import { getBasePack } from "@/core/industries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  packId: z.string(),
  itemId: z.string(),
  price: z.number().positive().optional(),
  availabilityStatus: z.enum(["Available", "Reserved", "Booked", "Sold"]).optional(),
});

/**
 * Test-only fixture for the Recap live-diff acceptance test ("PRICE
 * UPDATED" / "NO LONGER AVAILABLE" — spec sections 26-27). InventoryItem
 * data lives in-process as a plain singleton module (getBasePack), not a
 * database row, so there is no admin UI or authenticated route that can
 * simulate "the price changed since the customer last opened their
 * Recap" — this directly mutates the live pack object the same way the
 * (deleted, PR17-scratch) temp route did, but kept as permanent test
 * infrastructure since the acceptance test it serves is permanent. Gated
 * identically to /api/test/reset and /api/test/seed-recap-fixtures.
 */
export async function POST(request: Request) {
  if (process.env.ALLOW_TEST_RESET !== "true") {
    return new NextResponse(null, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid-request" }, { status: 400 });
  }
  const { packId, itemId, price, availabilityStatus } = parsed.data;

  const item = getBasePack(packId).inventory.find((i) => i.id === itemId);
  if (!item) return NextResponse.json({ error: "not-found" }, { status: 404 });

  if (price !== undefined) item.price = price;
  if (availabilityStatus !== undefined) item.availabilityStatus = availabilityStatus;

  return NextResponse.json({ ok: true, item: { id: item.id, price: item.price, availabilityStatus: item.availabilityStatus } });
}

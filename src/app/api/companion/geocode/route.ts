import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, AuthError } from "@/lib/auth/server";
import { geocodeAddress, GeoLookupError } from "@/lib/inventory/geo";
import { nearestDistricts } from "@/lib/locationIntelligence";
import { getBasePack } from "@/core/industries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  query: z.string().min(1).max(500),
  packId: z.string().min(1).max(100),
});

/**
 * Session-authenticated, no capability gate — same posture as
 * POST /api/buyer-profiles/match: any logged-in salesperson can look up a
 * customer's workplace during a live meeting, there's nothing tenant-
 * privileged about it. Deliberately NOT the admin /api/inventory/geocode
 * route (that one is inventory.edit-gated for the Builder) — reuses its
 * same underlying geocodeAddress() core, just with a lighter, Companion-
 * appropriate gate. Also computes the pack's nearest districts server-side
 * so the client never needs its own copy of the distance math.
 */
export async function POST(request: Request) {
  try {
    await requireSession();
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }

    const result = await geocodeAddress(parsed.data.query);
    const pack = getBasePack(parsed.data.packId);
    const districts = nearestDistricts(pack, result);

    return NextResponse.json({ ...result, nearestDistricts: districts });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof GeoLookupError) return NextResponse.json({ error: err.code, message: err.message }, { status: 422 });
    throw err;
  }
}

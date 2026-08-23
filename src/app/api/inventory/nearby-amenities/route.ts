import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { findNearbyAmenities, GeoLookupError } from "@/lib/inventory/geo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export async function POST(request: Request) {
  try {
    await requireCapability("inventory.edit");
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }

    const amenities = await findNearbyAmenities(parsed.data.lat, parsed.data.lng);
    return NextResponse.json({ amenities });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof GeoLookupError) return NextResponse.json({ error: err.code, message: err.message }, { status: 422 });
    throw err;
  }
}

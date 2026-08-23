import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { geocodeAddress, GeoLookupError } from "@/lib/inventory/geo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ query: z.string().min(1).max(500) });

export async function POST(request: Request) {
  try {
    await requireCapability("inventory.edit");
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }

    const result = await geocodeAddress(parsed.data.query);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof GeoLookupError) return NextResponse.json({ error: err.code, message: err.message }, { status: 422 });
    throw err;
  }
}

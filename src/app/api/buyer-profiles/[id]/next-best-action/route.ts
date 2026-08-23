import { NextResponse } from "next/server";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { resolveNextBestAction } from "@/lib/buyerProfiles/nextBestAction";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Wave 2 — tenant rules first, the Wave 1 hardcoded hint as fallback. See resolveNextBestAction. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("buyer-intelligence.view");
    const { id } = await params;
    const result = await resolveNextBestAction(ctx, id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

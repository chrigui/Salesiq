import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, AuthError } from "@/lib/auth/server";
import { matchOrCreateBuyerProfile } from "@/lib/buyerProfiles/match";
import { toBuyerProfileDTO } from "@/lib/serializers/buyerProfile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().max(200),
  email: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
});

/**
 * Session-authenticated, no capability gate — same ungated pattern as
 * saving a lead or sharing a session (any salesperson can link their own
 * live Companion session to a buyer identity; there's nothing tenant-
 * privileged about it). Auto-matches by normalized email/phone within the
 * tenant, creating a new BuyerProfile if neither matches an existing one.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireSession();
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }

    const profile = await matchOrCreateBuyerProfile({
      tenantId: ctx.tenantId,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      branchId: ctx.branchId,
      assignedToId: ctx.userId,
    });
    if (!profile) {
      return NextResponse.json({ error: "insufficient-contact-info" }, { status: 400 });
    }

    return NextResponse.json({ buyerProfile: toBuyerProfileDTO(profile) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

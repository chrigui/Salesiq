import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * "Who am I" probe — deliberately excluded from middleware's matcher and
 * always returns 200, even when signed out, since it's polled on every
 * mount rather than gating access to anything itself.
 */
export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ session: null });

  return NextResponse.json({
    session: {
      userId: ctx.userId,
      name: ctx.name,
      email: ctx.email,
      role: ctx.role,
      branchId: ctx.branchId,
      issuedAt: ctx.issuedAt,
      expiresAt: ctx.expiresAt,
    },
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDefaultTenant } from "@/lib/auth/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Powers the LoginScreen's quick-account chips. Gated on SHOW_DEMO_LOGINS —
 * must be "false" in production, since this leaks a user list pre-auth.
 */
export async function GET() {
  if (process.env.SHOW_DEMO_LOGINS !== "true") {
    return new NextResponse(null, { status: 404 });
  }

  const tenant = await getDefaultTenant();
  const users = await prisma.user.findMany({
    where: { tenantId: tenant.id, status: "active" },
    select: { id: true, name: true, email: true, role: true },
    take: 3,
  });

  return NextResponse.json({ users });
}

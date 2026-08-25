import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionContext } from "@/lib/auth/server";
import { getDefaultTenant } from "@/lib/auth/tenant";
import { toBrandProfileDTO } from "@/lib/serializers/brandProfile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The whole-Display default brand kit (Theme-PR3) — the live Customer
 * Display polls this once to theme the entire generic shell (Welcome,
 * Matches, Recap, etc.), not just Display-Studio-profile-driven item views.
 * Tenant resolution mirrors GET /api/display-profiles/resolve exactly: the
 * caller's own session if one exists, else the pilot's single
 * DEFAULT_TENANT_SLUG — the Display has no login of its own today.
 */
export async function GET() {
  const ctx = await getSessionContext();
  const tenant = ctx ? { id: ctx.tenantId } : await getDefaultTenant();

  const brandProfile = await prisma.brandProfile.findFirst({
    where: { tenantId: tenant.id, isDefault: true },
  });

  return NextResponse.json({ brandProfile: brandProfile ? toBrandProfileDTO(brandProfile) : null });
}

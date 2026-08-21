import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionContext } from "@/lib/auth/server";
import { getDefaultTenant } from "@/lib/auth/tenant";
import { getBasePack } from "@/core/industries";
import { toDisplayProfileDTO } from "@/lib/serializers/displayProfile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Runtime resolver the live Customer Display polls to find a Published
 * profile for the item it's currently focused on. Tenant is resolved the
 * same way POST /api/leads does: the caller's own session if one exists,
 * else the pilot's single DEFAULT_TENANT_SLUG — the Display, like the
 * Companion, has no login of its own today (see that route's SECURITY
 * comment). packId/itemId aren't secret; they're already broadcast in the
 * live MQTT session payload every paired Display already receives.
 *
 * PR1 shortcut, called out in the Display Studio plan: this is unauthenticated
 * beyond tenant resolution. From PR2 onward, once a Display has a persisted,
 * claimed identity (a deviceToken), this tightens to resolving strictly
 * against *that* display's own tenant rather than the pilot default.
 */
export async function GET(request: NextRequest) {
  const packId = request.nextUrl.searchParams.get("packId");
  const itemId = request.nextUrl.searchParams.get("itemId");
  if (!packId || !itemId) {
    return NextResponse.json({ error: "invalid-request" }, { status: 400 });
  }

  const ctx = await getSessionContext();
  const tenant = ctx ? { id: ctx.tenantId } : await getDefaultTenant();

  const profile = await prisma.displayProfile.findFirst({
    where: { tenantId: tenant.id, packId, itemId, status: "Published" },
    orderBy: { publishedAt: "desc" },
    include: { brandProfile: true, assets: { select: { id: true, name: true, mimeType: true, sizeBytes: true } } },
  });
  if (!profile) {
    return NextResponse.json({ profile: null });
  }

  const pack = getBasePack(packId);
  const item = pack.inventory.find((i) => i.id === itemId);
  if (!item) {
    return NextResponse.json({ profile: null });
  }

  return NextResponse.json({ profile: toDisplayProfileDTO(profile) });
}

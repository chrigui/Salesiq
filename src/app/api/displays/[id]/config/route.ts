import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toDisplayDTO } from "@/lib/serializers/display";
import { toDisplayProfileDTO } from "@/lib/serializers/displayProfile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tokensMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * What a claimed Display polls every 30-60s. Auth is the deviceToken from
 * claim (not a login session — a kiosk has none), sent as a query param
 * since this is a simple GET a <script> on the display can call directly.
 * Doubles as a heartbeat: every successful poll bumps lastSeenAt, which is
 * the entire basis for the dashboard's online/offline indicator.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "missing-token" }, { status: 401 });
  }

  const display = await prisma.display.findUnique({ where: { id } });
  if (!display || !display.deviceToken || !tokensMatch(display.deviceToken, token)) {
    return NextResponse.json({ error: "invalid-token" }, { status: 401 });
  }

  let idleProfile = null;
  if (display.idleProfileId) {
    const profile = await prisma.displayProfile.findFirst({
      where: { id: display.idleProfileId, tenantId: display.tenantId, status: "Published" },
    });
    if (profile) idleProfile = toDisplayProfileDTO(profile);
  }

  await prisma.display.update({
    where: { id },
    data: {
      lastSeenAt: new Date(),
      lastSeenVersion: idleProfile ? Math.floor(idleProfile.updatedAt / 1000) : null,
    },
  });

  return NextResponse.json({ display: toDisplayDTO(display), idleProfile });
}

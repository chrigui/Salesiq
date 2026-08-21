import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateDeviceToken } from "@/lib/displays/pairingCode";
import { logTenantAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const claimSchema = z.object({ pairingCode: z.string().min(1).max(20) });

/**
 * Unauthenticated by design — a kiosk has no login. The pairingCode itself
 * is the credential (same trust model as a Brochure/DealRoom slug: whoever
 * has the code, from the QR the admin generated, may claim it). Re-claiming
 * an already-claimed code is allowed and simply mints a fresh deviceToken,
 * invalidating the old one — the intended path for replacing a physical
 * screen without deleting and re-registering the Display row.
 */
export async function POST(request: Request) {
  const parsed = claimSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid-request" }, { status: 400 });
  }

  const display = await prisma.display.findUnique({
    where: { pairingCode: parsed.data.pairingCode.trim().toUpperCase() },
  });
  if (!display) {
    return NextResponse.json({ error: "unknown-code" }, { status: 404 });
  }

  const deviceToken = generateDeviceToken();
  const userAgent = request.headers.get("user-agent") ?? "";
  await prisma.display.update({
    where: { id: display.id },
    data: { deviceToken, status: "Active", userAgent: userAgent.slice(0, 300), lastSeenAt: new Date() },
  });

  await logTenantAudit({
    tenantId: display.tenantId,
    actor: "Display pairing",
    action: "display.claimed",
    target: display.id,
    detail: `Display "${display.name}" was paired from a new browser`,
  });

  return NextResponse.json({ displayId: display.id, deviceToken, name: display.name });
}

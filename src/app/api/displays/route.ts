import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { toDisplayDTO } from "@/lib/serializers/display";
import { generateUniquePairingCode } from "@/lib/displays/pairingCode";
import { logTenantAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ctx = await requireCapability("display-studio.view");
    const displays = await prisma.display.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ displays: displays.map(toDisplayDTO) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(200),
  branchId: z.string().min(1).max(100).optional(),
});

export async function POST(request: Request) {
  try {
    const ctx = await requireCapability("display-studio.manage");
    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }

    if (parsed.data.branchId) {
      const branch = await prisma.branch.findFirst({
        where: { id: parsed.data.branchId, tenantId: ctx.tenantId },
        select: { id: true },
      });
      if (!branch) return NextResponse.json({ error: "unknown-branch" }, { status: 404 });
    }

    const pairingCode = await generateUniquePairingCode();
    const display = await prisma.display.create({
      data: {
        tenantId: ctx.tenantId,
        name: parsed.data.name,
        branchId: parsed.data.branchId ?? null,
        pairingCode,
        status: "Pending",
        createdById: ctx.userId,
      },
    });

    await logTenantAudit({
      tenantId: ctx.tenantId,
      actor: ctx.name,
      action: "display.created",
      target: display.id,
      detail: `Registered display "${display.name}"`,
    });

    return NextResponse.json({ display: toDisplayDTO(display) }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

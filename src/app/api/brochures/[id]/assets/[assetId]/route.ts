import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { logTenantAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; assetId: string }> },
) {
  try {
    const ctx = await requireCapability("brochures.manage");
    const { id, assetId } = await params;
    const asset = await prisma.brochureAsset.findFirst({
      where: { id: assetId, brochureId: id, tenantId: ctx.tenantId },
    });
    if (!asset) return NextResponse.json({ error: "not-found" }, { status: 404 });

    return new NextResponse(new Uint8Array(asset.data), {
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(asset.name)}"`,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; assetId: string }> },
) {
  try {
    const ctx = await requireCapability("brochures.manage");
    const { id, assetId } = await params;
    const result = await prisma.brochureAsset.deleteMany({
      where: { id: assetId, brochureId: id, tenantId: ctx.tenantId },
    });
    if (result.count === 0) return NextResponse.json({ error: "not-found" }, { status: 404 });

    await logTenantAudit({
      tenantId: ctx.tenantId,
      actor: ctx.name,
      action: "brochure.asset-deleted",
      target: id,
      detail: `Deleted a document attachment`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

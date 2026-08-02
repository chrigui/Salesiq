import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { logTenantAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB — no object storage is configured, bytes live in Postgres
const ALLOWED_MIME = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("brochures.manage");
    const { id } = await params;
    const brochure = await prisma.brochure.findFirst({ where: { id, tenantId: ctx.tenantId } });
    if (!brochure) return NextResponse.json({ error: "not-found" }, { status: 404 });

    const assets = await prisma.brochureAsset.findMany({
      where: { brochureId: id },
      select: { id: true, name: true, mimeType: true, sizeBytes: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      assets: assets.map((a) => ({ ...a, createdAt: a.createdAt.getTime() })),
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

const metaSchema = z.object({
  name: z.string().min(1).max(200),
  mimeType: z.string().min(1).max(100),
  dataBase64: z.string().min(1),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("brochures.manage");
    const { id } = await params;
    const brochure = await prisma.brochure.findFirst({ where: { id, tenantId: ctx.tenantId } });
    if (!brochure) return NextResponse.json({ error: "not-found" }, { status: 404 });

    const parsed = metaSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }
    const { name, mimeType, dataBase64 } = parsed.data;
    if (!ALLOWED_MIME.has(mimeType)) {
      return NextResponse.json({ error: "unsupported-file-type" }, { status: 400 });
    }

    const data = Buffer.from(dataBase64, "base64");
    if (data.byteLength === 0 || data.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "file-too-large" }, { status: 400 });
    }

    const asset = await prisma.brochureAsset.create({
      data: { brochureId: id, tenantId: ctx.tenantId, name, mimeType, sizeBytes: data.byteLength, data },
    });

    await logTenantAudit({
      tenantId: ctx.tenantId,
      actor: ctx.name,
      action: "brochure.asset-uploaded",
      target: id,
      detail: `Uploaded document "${name}"`,
    });

    return NextResponse.json(
      { asset: { id: asset.id, name: asset.name, mimeType: asset.mimeType, sizeBytes: asset.sizeBytes, createdAt: asset.createdAt.getTime() } },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

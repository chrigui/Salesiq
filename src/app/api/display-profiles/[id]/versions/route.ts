import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { toDisplayProfileVersionDTO } from "@/lib/serializers/displayProfileVersion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("display-studio.view");
    const { id } = await params;

    const profile = await prisma.displayProfile.findFirst({ where: { id, tenantId: ctx.tenantId }, select: { id: true } });
    if (!profile) return NextResponse.json({ error: "not-found" }, { status: 404 });

    const versions = await prisma.displayProfileVersion.findMany({
      where: { profileId: id, tenantId: ctx.tenantId },
      orderBy: { version: "desc" },
      include: { author: { select: { name: true } } },
      take: 100,
    });
    return NextResponse.json({ versions: versions.map(toDisplayProfileVersionDTO) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

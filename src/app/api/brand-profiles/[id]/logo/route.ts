import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Authenticated logo fetch — mirrors display-profiles/[id]/assets/[assetId]'s tenant-scoped byte-serving pattern. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("display-studio.view");
    const { id } = await params;
    const brandProfile = await prisma.brandProfile.findFirst({
      where: { id, tenantId: ctx.tenantId },
      select: { logoData: true, logoMimeType: true },
    });
    if (!brandProfile?.logoData || !brandProfile.logoMimeType) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(brandProfile.logoData), {
      headers: { "Content-Type": brandProfile.logoMimeType },
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

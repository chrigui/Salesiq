import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { toUserDTO } from "@/lib/serializers/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  role: z.enum(["Owner", "Admin", "Manager", "Designer", "Salesperson", "Viewer"]).optional(),
  branchId: z.string().nullable().optional(),
  status: z.enum(["active", "invited", "suspended"]).optional(),
  mfaEnabled: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("users.manage");
    const { id } = await params;
    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }

    const result = await prisma.user.updateMany({
      where: { id, tenantId: ctx.tenantId },
      data: parsed.data,
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }

    const user = await prisma.user.findUniqueOrThrow({ where: { id } });
    return NextResponse.json({ user: toUserDTO(user) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("users.manage");
    const { id } = await params;
    const result = await prisma.user.deleteMany({ where: { id, tenantId: ctx.tenantId } });
    if (result.count === 0) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

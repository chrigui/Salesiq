import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const conditionSchema = z.object({
  questionId: z.string().min(1).max(100),
  op: z.enum(["gt", "gte", "lt", "lte", "eq", "includes", "truthy"]),
  value: z.union([z.number(), z.string(), z.boolean()]).optional(),
});

const patchSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  priority: z.number().int().optional(),
  conditions: z.array(conditionSchema).min(1).max(10).optional(),
  suggestion: z.string().min(1).max(500).optional(),
  enabled: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("buyer-intelligence.manage");
    const { id } = await params;
    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }
    const existing = await prisma.buyerNbaRule.findFirst({ where: { id, tenantId: ctx.tenantId } });
    if (!existing) return NextResponse.json({ error: "not-found" }, { status: 404 });

    await prisma.buyerNbaRule.update({
      where: { id },
      data: {
        ...(parsed.data.label !== undefined ? { label: parsed.data.label } : {}),
        ...(parsed.data.priority !== undefined ? { priority: parsed.data.priority } : {}),
        ...(parsed.data.conditions !== undefined ? { conditions: parsed.data.conditions } : {}),
        ...(parsed.data.suggestion !== undefined ? { suggestion: parsed.data.suggestion } : {}),
        ...(parsed.data.enabled !== undefined ? { enabled: parsed.data.enabled } : {}),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("buyer-intelligence.manage");
    const { id } = await params;
    const existing = await prisma.buyerNbaRule.findFirst({ where: { id, tenantId: ctx.tenantId } });
    if (!existing) return NextResponse.json({ error: "not-found" }, { status: 404 });

    await prisma.buyerNbaRule.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

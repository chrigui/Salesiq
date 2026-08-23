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

export async function GET() {
  try {
    const ctx = await requireCapability("buyer-intelligence.view");
    const rules = await prisma.buyerNbaRule.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { priority: "asc" },
    });
    return NextResponse.json({ rules });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

const createSchema = z.object({
  label: z.string().min(1).max(200),
  priority: z.number().int(),
  conditions: z.array(conditionSchema).min(1).max(10),
  suggestion: z.string().min(1).max(500),
  enabled: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const ctx = await requireCapability("buyer-intelligence.manage");
    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }
    const rule = await prisma.buyerNbaRule.create({
      data: {
        tenantId: ctx.tenantId,
        label: parsed.data.label,
        priority: parsed.data.priority,
        conditions: parsed.data.conditions,
        suggestion: parsed.data.suggestion,
        enabled: parsed.data.enabled ?? true,
      },
    });
    return NextResponse.json({ id: rule.id });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

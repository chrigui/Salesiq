import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { toLeadDTO } from "@/lib/serializers/lead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "won", "lost"]).optional(),
  assignedTo: z.string().nullable().optional(),
  followUpAt: z.number().nullable().optional(),
  notes: z.string().max(2000).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("leads.edit");
    const { id } = await params;
    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }

    const { assignedTo, followUpAt, ...rest } = parsed.data;
    const result = await prisma.lead.updateMany({
      where: { id, tenantId: ctx.tenantId },
      data: {
        ...rest,
        ...(assignedTo !== undefined ? { assignedToId: assignedTo } : {}),
        ...(followUpAt !== undefined ? { followUpAt: followUpAt ? new Date(followUpAt) : null } : {}),
      },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }

    const lead = await prisma.lead.findUniqueOrThrow({ where: { id } });
    return NextResponse.json({ lead: toLeadDTO(lead) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

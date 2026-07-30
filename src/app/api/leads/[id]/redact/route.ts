import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { toLeadDTO } from "@/lib/serializers/lead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GDPR "right to be forgotten" — a separate, audited, irreversible action,
 * not a generic PATCH. Still writes the literal string "Redacted" to
 * `name` for compatibility with SecurityCompliance.tsx's existing filter;
 * `redactedAt` makes a real predicate possible later without breaking it.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("security.manage");
    const { id } = await params;

    const result = await prisma.lead.updateMany({
      where: { id, tenantId: ctx.tenantId },
      data: { name: "Redacted", phone: "", email: "", notes: "", redactedAt: new Date() },
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

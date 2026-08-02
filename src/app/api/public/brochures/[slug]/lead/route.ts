import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { resolvePublicBrochure } from "@/lib/brochures/resolve";
import { toLeadDTO } from "@/lib/serializers/lead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const leadSchema = z.object({
  name: z.string().max(200),
  phone: z.string().max(50).default(""),
  email: z.string().max(200).default(""),
  notes: z.string().max(2000).default(""),
});

/**
 * Public, unauthenticated — the microsite's "Book Viewing"/lead-capture
 * form. Same shape as POST /api/leads' createSchema, plus brochureId for
 * attribution. There's no interactive Q&A session behind a brochure visit,
 * so there's no real decision-engine score to report — score is stored as 0
 * (not fabricated) rather than inventing a fit percentage.
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolved = await resolvePublicBrochure(slug);
  if (!resolved) return NextResponse.json({ error: "not-found" }, { status: 404 });

  const parsed = leadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid-request" }, { status: 400 });
  }

  const lead = await prisma.lead.create({
    data: {
      ...parsed.data,
      tenantId: resolved.tenantId,
      packId: resolved.pack.id,
      packLabel: resolved.pack.label,
      itemName: resolved.item.name,
      price: resolved.item.price,
      currency: resolved.item.currency,
      score: 0,
      source: "brochure",
      brochureId: resolved.brochureId,
    },
  });

  await prisma.brochureEvent.create({
    data: { brochureId: resolved.brochureId, tenantId: resolved.tenantId, kind: "LeadSubmitted" },
  });

  return NextResponse.json({ lead: toLeadDTO(lead) }, { status: 201 });
}

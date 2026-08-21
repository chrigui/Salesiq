import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { PACKS_BY_ID } from "@/core/industries";
import { toLeadDTO } from "@/lib/serializers/lead";
import { matchOrCreateBuyerProfile } from "@/lib/buyerProfiles/match";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tokensMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

const leadSchema = z.object({
  token: z.string().min(1),
  packId: z.string().min(1).max(100),
  itemId: z.string().min(1).max(100),
  name: z.string().max(200),
  phone: z.string().max(50).default(""),
  email: z.string().max(200).default(""),
  notes: z.string().max(2000).default(""),
});

/**
 * Public, unauthenticated — the Customer Display's leadCapture widget. The
 * deviceToken (same credential a claimed kiosk already holds in
 * localStorage, see /api/displays/claim) is the only trust boundary, same
 * model as a Brochure slug. Item name/price/currency are always looked up
 * server-side from the real shipped pack, never trusted from the request
 * body — a kiosk can only attribute a lead to a real listing, not spoof one.
 */
export async function POST(request: Request, { params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await params;
  const parsed = leadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid-request" }, { status: 400 });
  }
  const { token, packId, itemId, name, phone, email, notes } = parsed.data;

  const display = await prisma.display.findUnique({ where: { id: deviceId } });
  if (!display || !display.deviceToken || !tokensMatch(display.deviceToken, token)) {
    return NextResponse.json({ error: "invalid-token" }, { status: 401 });
  }

  const pack = PACKS_BY_ID[packId];
  const item = pack?.inventory.find((i) => i.id === itemId);
  if (!pack || !item) {
    return NextResponse.json({ error: "unknown-item" }, { status: 404 });
  }

  const buyerProfile = await matchOrCreateBuyerProfile({
    tenantId: display.tenantId,
    name,
    email,
    phone,
    branchId: display.branchId,
  });

  const lead = await prisma.lead.create({
    data: {
      tenantId: display.tenantId,
      branchId: display.branchId,
      name,
      phone,
      email,
      notes,
      packId: pack.id,
      packLabel: pack.label,
      itemName: item.name,
      price: item.price,
      currency: item.currency,
      score: 0,
      source: "display",
      displayId: display.id,
      buyerProfileId: buyerProfile?.id ?? null,
    },
  });

  return NextResponse.json({ lead: toLeadDTO(lead) }, { status: 201 });
}

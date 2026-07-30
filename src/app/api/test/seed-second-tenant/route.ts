import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Test-only fixture for cross-tenant isolation coverage. Creates a second,
 * throwaway tenant with one lead of its own — the only thing that
 * actually catches a forgotten `tenantId` filter, since this app is
 * otherwise single-tenant in practice and such a bug would be invisible
 * in every other test. Gated identically to /api/test/reset.
 */
export async function POST() {
  if (process.env.ALLOW_TEST_RESET !== "true") {
    return new NextResponse(null, { status: 404 });
  }

  const other = await prisma.tenant.upsert({
    where: { slug: "acme-other" },
    update: {},
    create: {
      slug: "acme-other",
      name: "Acme Other Co",
      workingHours: { days: ["Mon"], open: "09:00", close: "17:00" },
      businessUnits: [],
    },
  });

  await prisma.lead.deleteMany({ where: { tenantId: other.id } });
  await prisma.lead.create({
    data: {
      tenantId: other.id,
      name: "Other Tenant Contact",
      phone: "",
      email: "",
      notes: "",
      packId: "real-estate",
      packLabel: "Real Estate",
      itemName: "Acme Exclusive Villa",
      price: 999_000,
      currency: "USD",
      score: 88,
      source: "test-fixture",
    },
  });

  return new NextResponse(null, { status: 204 });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { toBrandProfileDTO } from "@/lib/serializers/brandProfile";
import { logTenantAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ctx = await requireCapability("display-studio.view");
    const profiles = await prisma.brandProfile.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ brandProfiles: profiles.map(toBrandProfileDTO) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().max(20).optional(),
  brandSoft: z.string().max(20).optional(),
  logoGlyph: z.string().max(10).optional(),
  fontHeading: z.string().max(100).optional(),
  fontBody: z.string().max(100).optional(),
  backgroundColor: z.string().max(20).optional(),
  textColor: z.string().max(20).optional(),
  cardStyle: z.enum(["Glass", "Solid", "Outlined"]).optional(),
  buttonStyle: z.enum(["Filled", "Outline", "Ghost"]).optional(),
  borderRadius: z.enum(["Sharp", "Soft", "Round"]).optional(),
  shadowIntensity: z.enum(["Flat", "Subtle", "Elevated"]).optional(),
  spacingScale: z.enum(["Compact", "Comfortable", "Spacious"]).optional(),
  defaultMotionPreset: z.string().max(20).optional(),
});

export async function POST(request: Request) {
  try {
    const ctx = await requireCapability("display-studio.manage");
    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }

    const brandProfile = await prisma.brandProfile.create({
      data: { tenantId: ctx.tenantId, createdById: ctx.userId, ...parsed.data },
    });

    await logTenantAudit({
      tenantId: ctx.tenantId,
      actor: ctx.name,
      action: "brand-profile.created",
      target: brandProfile.id,
      detail: `Created brand profile "${brandProfile.name}"`,
    });

    return NextResponse.json({ brandProfile: toBrandProfileDTO(brandProfile) }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

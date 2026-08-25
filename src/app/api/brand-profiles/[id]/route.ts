import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { toBrandProfileDTO } from "@/lib/serializers/brandProfile";
import { logTenantAudit } from "@/lib/audit";
import { FONT_OPTION_IDS } from "@/core/display/brandFonts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LOGO_BYTES = 8 * 1024 * 1024; // 8MB — same cap as DisplayProfileAsset
const ALLOWED_LOGO_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  brand: z.string().max(20).nullable().optional(),
  brandSoft: z.string().max(20).nullable().optional(),
  logoGlyph: z.string().max(10).nullable().optional(),
  // Curated ids only (see brandFonts.ts) — never a freeform font-family string.
  fontHeading: z.enum(FONT_OPTION_IDS).nullable().optional(),
  fontBody: z.enum(FONT_OPTION_IDS).nullable().optional(),
  backgroundColor: z.string().max(20).nullable().optional(),
  textColor: z.string().max(20).nullable().optional(),
  mutedTextColor: z.string().max(20).nullable().optional(),
  surfaceColor: z.string().max(20).nullable().optional(),
  successColor: z.string().max(20).nullable().optional(),
  warningColor: z.string().max(20).nullable().optional(),
  dangerColor: z.string().max(20).nullable().optional(),
  cardStyle: z.enum(["Glass", "Solid", "Outlined"]).optional(),
  buttonStyle: z.enum(["Filled", "Outline", "Ghost"]).optional(),
  borderRadius: z.enum(["Sharp", "Soft", "Round"]).optional(),
  shadowIntensity: z.enum(["Flat", "Subtle", "Elevated"]).optional(),
  spacingScale: z.enum(["Compact", "Comfortable", "Spacious"]).optional(),
  headingWeight: z.enum(["Regular", "Medium", "Semibold", "Bold"]).optional(),
  letterSpacing: z.enum(["Tight", "Normal", "Wide"]).optional(),
  defaultMotionPreset: z.string().max(20).nullable().optional(),
  // Logo upload/removal — a base64 data URL body, same convention as
  // DisplayProfileAsset's POST route (no multipart parsing needed).
  logoDataBase64: z.string().min(1).optional(),
  logoMimeType: z.enum(["image/png", "image/jpeg", "image/webp"]).optional(),
  removeLogo: z.boolean().optional(),
  // Whole-Display default brand (Theme-PR3) — setting true clears every
  // other kit's isDefault for this tenant in the same transaction, so
  // "exactly one default" holds without a DB-level constraint (same
  // convention as Published DisplayProfile resolution).
  setDefault: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("display-studio.manage");
    const { id } = await params;
    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }

    const { logoDataBase64, logoMimeType, removeLogo, setDefault, ...rest } = parsed.data;
    const data: typeof rest & { logoData?: Uint8Array<ArrayBuffer> | null; logoMimeType?: string | null; isDefault?: boolean } = {
      ...rest,
    };

    if (removeLogo) {
      data.logoData = null;
      data.logoMimeType = null;
    } else if (logoDataBase64 || logoMimeType) {
      if (!logoDataBase64 || !logoMimeType || !ALLOWED_LOGO_MIME.has(logoMimeType)) {
        return NextResponse.json({ error: "unsupported-file-type" }, { status: 400 });
      }
      const buffer = Buffer.from(logoDataBase64, "base64");
      if (buffer.byteLength === 0 || buffer.byteLength > MAX_LOGO_BYTES) {
        return NextResponse.json({ error: "file-too-large" }, { status: 400 });
      }
      data.logoData = Uint8Array.from(buffer) as Uint8Array<ArrayBuffer>;
      data.logoMimeType = logoMimeType;
    }
    if (setDefault !== undefined) data.isDefault = setDefault;

    const brandProfile = await prisma.$transaction(async (tx) => {
      if (setDefault) {
        await tx.brandProfile.updateMany({
          where: { tenantId: ctx.tenantId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }
      const result = await tx.brandProfile.updateMany({ where: { id, tenantId: ctx.tenantId }, data });
      if (result.count === 0) return null;
      return tx.brandProfile.findUniqueOrThrow({ where: { id } });
    });
    if (!brandProfile) return NextResponse.json({ error: "not-found" }, { status: 404 });

    return NextResponse.json({ brandProfile: toBrandProfileDTO(brandProfile) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("display-studio.manage");
    const { id } = await params;

    // Detach any profiles still pointing at this brand kit before deleting
    // it — onDelete: SetNull on the FK would do this at the DB level too,
    // but doing it explicitly here keeps the audit trail honest about what
    // actually happened, and works even if the FK constraint changes later.
    await prisma.displayProfile.updateMany({
      where: { brandProfileId: id, tenantId: ctx.tenantId },
      data: { brandProfileId: null },
    });

    const result = await prisma.brandProfile.deleteMany({ where: { id, tenantId: ctx.tenantId } });
    if (result.count === 0) return NextResponse.json({ error: "not-found" }, { status: 404 });

    await logTenantAudit({
      tenantId: ctx.tenantId,
      actor: ctx.name,
      action: "brand-profile.deleted",
      target: id,
      detail: "Deleted a brand profile",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Publishing a Display Profile snapshots its current draft state into an
 * immutable DisplayProfileVersion and flips it to isCurrent — the live
 * DisplayProfile row keeps changing as a draft afterward, but the real
 * Customer Display and idle poll only ever resolve against whichever
 * version has isCurrent true, so further edits never silently reflow
 * something already showing on a screen. Runs as a transaction since the
 * "exactly one isCurrent" invariant spans two writes (unset old, create new).
 */
export async function publishDisplayProfileVersion(params: {
  tenantId: string;
  profileId: string;
  authorId: string | null;
  changeReason?: string;
}) {
  const { tenantId, profileId, authorId, changeReason = "" } = params;

  return prisma.$transaction(async (tx) => {
    const profile = await tx.displayProfile.findFirstOrThrow({
      where: { id: profileId, tenantId },
      include: { brandProfile: true },
    });

    const overrides = profile.brandOverrides as { brand?: string; brandSoft?: string } | null;
    const brand = overrides?.brand ?? profile.brandProfile?.brand ?? null;
    const brandSoft = overrides?.brandSoft ?? profile.brandProfile?.brandSoft ?? null;
    // Everything else (fonts/logo/deep-theming tokens) has no per-profile
    // override today (only brand/brandSoft do) — snapshot the attached
    // brand kit's own values directly.
    const bp = profile.brandProfile;
    const logoMimeType = bp?.logoMimeType ?? null;
    const fontHeading = bp?.fontHeading ?? null;
    const fontBody = bp?.fontBody ?? null;
    const backgroundColor = bp?.backgroundColor ?? null;
    const textColor = bp?.textColor ?? null;
    const mutedTextColor = bp?.mutedTextColor ?? null;
    const surfaceColor = bp?.surfaceColor ?? null;
    const successColor = bp?.successColor ?? null;
    const warningColor = bp?.warningColor ?? null;
    const dangerColor = bp?.dangerColor ?? null;
    const cardStyle = bp?.cardStyle ?? null;
    const buttonStyle = bp?.buttonStyle ?? null;
    const borderRadius = bp?.borderRadius ?? null;
    const shadowIntensity = bp?.shadowIntensity ?? null;
    const spacingScale = bp?.spacingScale ?? null;
    const headingWeight = bp?.headingWeight ?? null;
    const letterSpacing = bp?.letterSpacing ?? null;
    const brandSnapshot = bp
      ? {
          brand,
          brandSoft,
          logoMimeType,
          fontHeading,
          fontBody,
          backgroundColor,
          textColor,
          mutedTextColor,
          surfaceColor,
          successColor,
          warningColor,
          dangerColor,
          cardStyle,
          buttonStyle,
          borderRadius,
          shadowIntensity,
          spacingScale,
          headingWeight,
          letterSpacing,
          brandProfileId: profile.brandProfileId,
        }
      : brand || brandSoft
        ? { brand, brandSoft, logoMimeType: null, fontHeading: null, fontBody: null, brandProfileId: profile.brandProfileId }
        : null;

    const last = await tx.displayProfileVersion.findFirst({
      where: { profileId },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    const nextVersion = (last?.version ?? 0) + 1;

    await tx.displayProfileVersion.updateMany({
      where: { profileId, isCurrent: true },
      data: { isCurrent: false },
    });

    const version = await tx.displayProfileVersion.create({
      data: {
        profileId,
        tenantId,
        version: nextVersion,
        sections: profile.sections as Prisma.InputJsonValue,
        motion: profile.motion as Prisma.InputJsonValue,
        idle: (profile.idle ?? undefined) as Prisma.InputJsonValue | undefined,
        brandSnapshot: (brandSnapshot ?? undefined) as Prisma.InputJsonValue | undefined,
        isCurrent: true,
        authorId,
        changeReason,
      },
    });

    await tx.displayProfile.update({
      where: { id: profileId },
      data: { status: "Published", publishedAt: new Date() },
    });

    return version;
  });
}

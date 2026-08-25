import type { BrandProfile as PrismaBrandProfile } from "@/generated/prisma/client";

/** Client-facing shape for a reusable Brand Profile ("Green Hills Luxury") — attachable to many Display Studio profiles. */
export interface BrandProfileDTO {
  id: string;
  createdAt: number;
  updatedAt: number;
  name: string;
  brand: string | null;
  brandSoft: string | null;
  logoGlyph: string | null;
  /** Presence flag only — the actual bytes are served from /api/brand-profiles/[id]/logo, never inlined here. */
  logoMimeType: string | null;
  fontHeading: string | null;
  fontBody: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  mutedTextColor: string | null;
  surfaceColor: string | null;
  successColor: string | null;
  warningColor: string | null;
  dangerColor: string | null;
  cardStyle: string;
  buttonStyle: string;
  borderRadius: string;
  shadowIntensity: string;
  spacingScale: string;
  headingWeight: string;
  letterSpacing: string;
  defaultMotionPreset: string | null;
  isDefault: boolean;
}

export function toBrandProfileDTO(row: PrismaBrandProfile): BrandProfileDTO {
  return {
    id: row.id,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
    name: row.name,
    brand: row.brand,
    brandSoft: row.brandSoft,
    logoGlyph: row.logoGlyph,
    logoMimeType: row.logoMimeType,
    fontHeading: row.fontHeading,
    fontBody: row.fontBody,
    backgroundColor: row.backgroundColor,
    textColor: row.textColor,
    mutedTextColor: row.mutedTextColor,
    surfaceColor: row.surfaceColor,
    successColor: row.successColor,
    warningColor: row.warningColor,
    dangerColor: row.dangerColor,
    cardStyle: row.cardStyle,
    buttonStyle: row.buttonStyle,
    borderRadius: row.borderRadius,
    shadowIntensity: row.shadowIntensity,
    spacingScale: row.spacingScale,
    headingWeight: row.headingWeight,
    letterSpacing: row.letterSpacing,
    defaultMotionPreset: row.defaultMotionPreset,
    isDefault: row.isDefault,
  };
}

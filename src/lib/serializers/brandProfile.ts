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
  cardStyle: string;
  buttonStyle: string;
  borderRadius: string;
  shadowIntensity: string;
  spacingScale: string;
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
    cardStyle: row.cardStyle,
    buttonStyle: row.buttonStyle,
    borderRadius: row.borderRadius,
    shadowIntensity: row.shadowIntensity,
    spacingScale: row.spacingScale,
    defaultMotionPreset: row.defaultMotionPreset,
    isDefault: row.isDefault,
  };
}

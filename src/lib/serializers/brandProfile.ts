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
  fontHeading: string | null;
  fontBody: string | null;
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
    fontHeading: row.fontHeading,
    fontBody: row.fontBody,
  };
}

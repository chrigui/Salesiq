import type {
  DisplayProfile as PrismaDisplayProfile,
  BrandProfile as PrismaBrandProfile,
  DisplayProfileAsset as PrismaDisplayProfileAsset,
} from "@/generated/prisma/client";

export interface DisplayProfileAssetMeta {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
}

export interface DisplaySection {
  id: string;
  type: string;
  enabled: boolean;
  order: number;
  config?: Record<string, unknown>;
}

export interface DisplayMotionConfig {
  preset: string;
  [key: string]: unknown;
}

/** Client-facing shape — mirrors src/core/store/displayProfiles.ts's DisplayProfile. */
export interface DisplayProfileDTO {
  id: string;
  createdAt: number;
  updatedAt: number;
  name: string;
  packId: string;
  itemId: string;
  template: PrismaDisplayProfile["template"];
  status: PrismaDisplayProfile["status"];
  sections: DisplaySection[];
  brandProfileId: string | null;
  // The attached BrandProfile's own colors, resolved live (no versioning
  // yet — see PR1's schema comment) so editing a shared brand kit is
  // reflected immediately everywhere it's attached. Renderer resolution
  // order: brandOverrides -> resolvedBrandProfile -> pack branding.
  resolvedBrandProfile: { brand: string | null; brandSoft: string | null; logoGlyph: string | null } | null;
  brandOverrides: { brand?: string; brandSoft?: string } | null;
  motion: DisplayMotionConfig;
  idle: Record<string, unknown> | null;
  publishedAt: number | null;
  assets: DisplayProfileAssetMeta[];
}

export function toDisplayProfileDTO(
  row: PrismaDisplayProfile & {
    brandProfile?: PrismaBrandProfile | null;
    assets?: Pick<PrismaDisplayProfileAsset, "id" | "name" | "mimeType" | "sizeBytes">[];
  },
): DisplayProfileDTO {
  return {
    id: row.id,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
    name: row.name,
    packId: row.packId,
    itemId: row.itemId,
    template: row.template,
    status: row.status,
    sections: (row.sections as unknown as DisplaySection[]) ?? [],
    brandProfileId: row.brandProfileId,
    resolvedBrandProfile: row.brandProfile
      ? { brand: row.brandProfile.brand, brandSoft: row.brandProfile.brandSoft, logoGlyph: row.brandProfile.logoGlyph }
      : null,
    brandOverrides: (row.brandOverrides as { brand?: string; brandSoft?: string } | null) ?? null,
    motion: (row.motion as unknown as DisplayMotionConfig) ?? { preset: "Cinematic" },
    idle: (row.idle as Record<string, unknown> | null) ?? null,
    publishedAt: row.publishedAt?.getTime() ?? null,
    assets: (row.assets ?? []).map((a) => ({ id: a.id, name: a.name, mimeType: a.mimeType, sizeBytes: a.sizeBytes })),
  };
}

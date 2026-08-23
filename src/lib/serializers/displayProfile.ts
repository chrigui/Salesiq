import type {
  DisplayProfile as PrismaDisplayProfile,
  BrandProfile as PrismaBrandProfile,
  DisplayProfileAsset as PrismaDisplayProfileAsset,
  DisplayProfileVersion as PrismaDisplayProfileVersion,
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
  layout: PrismaDisplayProfile["layout"];
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
    layout: row.layout,
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

/**
 * Runtime-facing shape: overlays a published, immutable version's frozen
 * content (sections/motion/idle/brand) on top of the profile's stable
 * identity fields (id/name/packId/itemId/template/assets). This is what the
 * real Customer Display and idle poll render — never the live draft row's
 * current sections, which may have kept changing since this version was
 * published.
 */
export function toPublishedDisplayProfileDTO(
  row: PrismaDisplayProfile & { assets?: Pick<PrismaDisplayProfileAsset, "id" | "name" | "mimeType" | "sizeBytes">[] },
  version: PrismaDisplayProfileVersion,
): DisplayProfileDTO {
  const base = toDisplayProfileDTO(row);
  const brandSnapshot = version.brandSnapshot as { brand?: string | null; brandSoft?: string | null } | null;
  return {
    ...base,
    sections: (version.sections as unknown as DisplaySection[]) ?? [],
    motion: (version.motion as unknown as DisplayMotionConfig) ?? { preset: "Cinematic" },
    idle: (version.idle as Record<string, unknown> | null) ?? null,
    resolvedBrandProfile: brandSnapshot
      ? { brand: brandSnapshot.brand ?? null, brandSoft: brandSnapshot.brandSoft ?? null, logoGlyph: null }
      : base.resolvedBrandProfile,
    // Already flattened into resolvedBrandProfile above — applying the
    // live draft's brandOverrides on top of a frozen version would let an
    // in-progress edit leak onto an already-published screen.
    brandOverrides: null,
  };
}

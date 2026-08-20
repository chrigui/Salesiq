import type { DisplayProfile as PrismaDisplayProfile } from "@/generated/prisma/client";

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
  brandOverrides: { brand?: string; brandSoft?: string } | null;
  motion: DisplayMotionConfig;
  idle: Record<string, unknown> | null;
  publishedAt: number | null;
}

export function toDisplayProfileDTO(row: PrismaDisplayProfile): DisplayProfileDTO {
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
    brandOverrides: (row.brandOverrides as { brand?: string; brandSoft?: string } | null) ?? null,
    motion: (row.motion as unknown as DisplayMotionConfig) ?? { preset: "Cinematic" },
    idle: (row.idle as Record<string, unknown> | null) ?? null,
    publishedAt: row.publishedAt?.getTime() ?? null,
  };
}

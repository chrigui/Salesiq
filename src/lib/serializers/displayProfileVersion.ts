import type { DisplayProfileVersion as PrismaDisplayProfileVersion } from "@/generated/prisma/client";

export interface DisplayProfileVersionDTO {
  id: string;
  version: number;
  isCurrent: boolean;
  authorName: string | null;
  changeReason: string;
  createdAt: number;
}

export function toDisplayProfileVersionDTO(
  row: PrismaDisplayProfileVersion & { author?: { name: string } | null },
): DisplayProfileVersionDTO {
  return {
    id: row.id,
    version: row.version,
    isCurrent: row.isCurrent,
    authorName: row.author?.name ?? null,
    changeReason: row.changeReason,
    createdAt: row.createdAt.getTime(),
  };
}

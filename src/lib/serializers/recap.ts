import type { Recap as PrismaRecap } from "@/generated/prisma/client";
import type { RecapComparedProperties, RecapShortlistedProperty } from "@/lib/recaps/types";

/** Owner-facing shape — the salesperson's own view of a recap they created. Never sent to the public /r/[code] route (see PublicRecapDTO, PR8). */
export interface RecapDTO {
  id: string;
  code: string;
  status: string;
  packId: string;
  buyerProfileId: string | null;
  customerNameSnapshot: string | null;
  customerStory: Record<string, unknown>;
  requirementsSnapshot: Record<string, unknown>;
  shortlistedProperties: RecapShortlistedProperty[];
  comparedProperties: RecapComparedProperties | null;
  finalRecommendationItemId: string | null;
  salespersonMessage: Record<string, unknown> | null;
  nextSteps: string[] | null;
  sectionVisibility: Record<string, string>;
  privateNotes: string | null;
  brandProfileId: string | null;
  expiresAt: number | null;
  publishedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export function toRecapDTO(row: PrismaRecap): RecapDTO {
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    packId: row.packId,
    buyerProfileId: row.buyerProfileId,
    customerNameSnapshot: row.customerNameSnapshot,
    customerStory: (row.customerStory as Record<string, unknown>) ?? {},
    requirementsSnapshot: (row.requirementsSnapshot as Record<string, unknown>) ?? {},
    shortlistedProperties: (row.shortlistedProperties as unknown as RecapShortlistedProperty[]) ?? [],
    comparedProperties: (row.comparedProperties as unknown as RecapComparedProperties | null) ?? null,
    finalRecommendationItemId: row.finalRecommendationItemId,
    salespersonMessage: (row.salespersonMessage as Record<string, unknown> | null) ?? null,
    nextSteps: (row.nextSteps as unknown as string[] | null) ?? null,
    sectionVisibility: (row.sectionVisibility as Record<string, string>) ?? {},
    privateNotes: row.privateNotes,
    brandProfileId: row.brandProfileId,
    expiresAt: row.expiresAt?.getTime() ?? null,
    publishedAt: row.publishedAt?.getTime() ?? null,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

/** Every Recap section spec section 3 lists — the Salesperson Review screen's EDIT/HIDE keys. Defaults to fully shown until PR5's review screen exists to let the salesperson choose. */
export function defaultSectionVisibility(): Record<string, string> {
  return {
    customer: "show",
    requirements: "show",
    shortlist: "show",
    propertiesExplored: "show",
    comparison: "show",
    finalRecommendation: "show",
    payment: "show",
    investment: "show",
    notes: "show",
  };
}

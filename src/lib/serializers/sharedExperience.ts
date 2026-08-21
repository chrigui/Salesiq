import type {
  SharedExperience as PrismaSharedExperience,
  SharedExperienceEvent as PrismaSharedExperienceEvent,
} from "@/generated/prisma/client";

/** Client-facing shape — mirrors src/core/store/sharedExperiences.ts's SharedExperience. */
export interface SharedExperienceDTO {
  id: string;
  code: string;
  packId: string;
  itemIds: string[];
  focusedItemId: string | null;
  proposalText: string | null;
  proposalEngine: string | null;
  customerName: string | null;
  createdAt: number;
  expiresAt: number | null;
}

export function toSharedExperienceDTO(row: PrismaSharedExperience): SharedExperienceDTO {
  return {
    id: row.id,
    code: row.code,
    packId: row.packId,
    itemIds: (row.itemIds as unknown as string[]) ?? [],
    focusedItemId: row.focusedItemId,
    proposalText: row.proposalText,
    proposalEngine: row.proposalEngine,
    customerName: row.customerName,
    createdAt: row.createdAt.getTime(),
    expiresAt: row.expiresAt?.getTime() ?? null,
  };
}

export interface SharedExperienceAnalyticsDTO {
  views: number;
  itemClicks: number;
  proposalViews: number;
  daily: { date: string; views: number; itemClicks: number; proposalViews: number }[];
}

/** Aggregates raw SharedExperienceEvent rows — no fabricated numbers, only counts of real recorded events. */
export function summarizeSharedExperienceEvents(events: PrismaSharedExperienceEvent[]): SharedExperienceAnalyticsDTO {
  const byDate = new Map<string, { views: number; itemClicks: number; proposalViews: number }>();
  let views = 0;
  let itemClicks = 0;
  let proposalViews = 0;

  for (const ev of events) {
    const date = ev.createdAt.toISOString().slice(0, 10);
    const bucket = byDate.get(date) ?? { views: 0, itemClicks: 0, proposalViews: 0 };
    if (ev.kind === "View") { views++; bucket.views++; }
    else if (ev.kind === "ItemClick") { itemClicks++; bucket.itemClicks++; }
    else if (ev.kind === "ProposalView") { proposalViews++; bucket.proposalViews++; }
    byDate.set(date, bucket);
  }

  const daily = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));

  return { views, itemClicks, proposalViews, daily };
}

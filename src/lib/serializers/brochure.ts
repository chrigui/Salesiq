import type { Brochure as PrismaBrochure, BrochureEvent as PrismaBrochureEvent } from "@/generated/prisma/client";

export interface BrochureSection {
  id: string;
  type: string;
  enabled: boolean;
  order: number;
  config?: Record<string, unknown>;
}

/** Client-facing shape — mirrors src/core/store/brochures.ts's Brochure. */
export interface BrochureDTO {
  id: string;
  createdAt: number;
  updatedAt: number;
  packId: string;
  itemId: string;
  slug: string;
  template: PrismaBrochure["template"];
  theme: PrismaBrochure["theme"];
  status: PrismaBrochure["status"];
  sections: BrochureSection[];
  brandingOverrides: Record<string, unknown> | null;
  publishedAt: number | null;
}

export function toBrochureDTO(row: PrismaBrochure): BrochureDTO {
  return {
    id: row.id,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
    packId: row.packId,
    itemId: row.itemId,
    slug: row.slug,
    template: row.template,
    theme: row.theme,
    status: row.status,
    sections: (row.sections as unknown as BrochureSection[]) ?? [],
    brandingOverrides: (row.brandingOverrides as Record<string, unknown> | null) ?? null,
    publishedAt: row.publishedAt?.getTime() ?? null,
  };
}

export interface BrochureAnalyticsDTO {
  views: number;
  scans: number;
  clicks: number;
  leads: number;
  daily: { date: string; views: number; scans: number; clicks: number; leads: number }[];
}

/** Aggregates raw BrochureEvent rows into the analytics shape above — no fabricated numbers, only counts of real recorded events. */
export function summarizeBrochureEvents(events: PrismaBrochureEvent[]): BrochureAnalyticsDTO {
  const byDate = new Map<string, { views: number; scans: number; clicks: number; leads: number }>();
  let views = 0;
  let scans = 0;
  let clicks = 0;
  let leads = 0;

  for (const ev of events) {
    const date = ev.createdAt.toISOString().slice(0, 10);
    const bucket = byDate.get(date) ?? { views: 0, scans: 0, clicks: 0, leads: 0 };
    if (ev.kind === "View") { views++; bucket.views++; }
    else if (ev.kind === "Scan") { scans++; bucket.scans++; }
    else if (ev.kind === "Click") { clicks++; bucket.clicks++; }
    else if (ev.kind === "LeadSubmitted") { leads++; bucket.leads++; }
    byDate.set(date, bucket);
  }

  const daily = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));

  return { views, scans, clicks, leads, daily };
}

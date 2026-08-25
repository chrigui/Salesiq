import type { Display as PrismaDisplay } from "@/generated/prisma/client";

/** Client-facing shape for the dashboard's Displays list/editor. Deliberately excludes deviceToken — that's a bearer credential, only ever returned once, at claim time. */
export interface DisplayDTO {
  id: string;
  createdAt: number;
  updatedAt: number;
  name: string;
  branchId: string | null;
  pairingCode: string;
  claimed: boolean;
  idleProfileId: string | null;
  liveProfileId: string | null;
  defaultExperience: PrismaDisplay["defaultExperience"];
  status: PrismaDisplay["status"];
  lastSeenAt: number | null;
  online: boolean;
}

/** A Display counts as "online" if it's polled its config within the last 90s — 3x the client's poll interval, so one missed tick doesn't flip it offline. */
const ONLINE_WINDOW_MS = 90_000;

export function toDisplayDTO(row: PrismaDisplay): DisplayDTO {
  const lastSeenAt = row.lastSeenAt?.getTime() ?? null;
  return {
    id: row.id,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
    name: row.name,
    branchId: row.branchId,
    pairingCode: row.pairingCode,
    claimed: Boolean(row.deviceToken),
    idleProfileId: row.idleProfileId,
    liveProfileId: row.liveProfileId,
    defaultExperience: row.defaultExperience,
    status: row.status,
    lastSeenAt,
    online: lastSeenAt !== null && Date.now() - lastSeenAt < ONLINE_WINDOW_MS,
  };
}

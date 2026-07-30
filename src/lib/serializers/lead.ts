import type { Lead as PrismaLead } from "@/generated/prisma/client";

/** Client-facing shape — mirrors src/core/store/leads.ts's Lead exactly. */
export interface LeadDTO {
  id: string;
  createdAt: number;
  name: string;
  phone: string;
  email: string;
  notes: string;
  packId: string;
  packLabel: string;
  itemName: string;
  price: number;
  currency: string;
  score: number;
  status: PrismaLead["status"];
  assignedTo: string | null;
  followUpAt: number | null;
}

export function toLeadDTO(row: PrismaLead): LeadDTO {
  return {
    id: row.id,
    createdAt: row.createdAt.getTime(),
    name: row.name,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    packId: row.packId,
    packLabel: row.packLabel,
    itemName: row.itemName,
    price: Number(row.price),
    currency: row.currency,
    score: row.score,
    status: row.status,
    assignedTo: row.assignedToId,
    followUpAt: row.followUpAt?.getTime() ?? null,
  };
}

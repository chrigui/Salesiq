import type { BuyerProfile as PrismaBuyerProfile } from "@/generated/prisma/client";
import type { BuyerField } from "@/core/buyerIntelligence/types";
import type { BuyerPriority } from "@/core/buyerIntelligence/priorityWeights";

/** Client-facing shape — mirrors src/core/store/buyerProfiles.ts's BuyerProfile. */
export interface BuyerProfileDTO {
  id: string;
  branchId: string | null;
  name: string;
  email: string;
  phone: string;
  preferredLanguage: string | null;
  market: string | null;
  leadSource: string;
  assignedToId: string | null;
  assignedToName: string | null;

  requirements: Record<string, BuyerField<unknown>> | null;
  financial: Record<string, BuyerField<unknown>> | null;
  purposes: string[];
  motivations: { id: string; label: string; tier: "primary" | "secondary"; evidence: string[] }[] | null;
  priorities: BuyerPriority[] | null;
  preferences: Record<string, unknown> | null;

  intentLevel: string | null;
  intentReasons: string[] | null;
  intentUpdatedAt: number | null;

  purchaseReadiness: string | null;
  purchaseReadinessConfidence: number | null;
  purchaseReadinessSignals: string[] | null;

  lastInteractionAt: number | null;
  createdAt: number;
  updatedAt: number;
}

type BuyerProfileRow = PrismaBuyerProfile & { assignedTo?: { name: string } | null };

export function toBuyerProfileDTO(row: BuyerProfileRow): BuyerProfileDTO {
  return {
    id: row.id,
    branchId: row.branchId,
    name: row.name,
    email: row.email,
    phone: row.phone,
    preferredLanguage: row.preferredLanguage,
    market: row.market,
    leadSource: row.leadSource,
    assignedToId: row.assignedToId,
    assignedToName: row.assignedTo?.name ?? null,

    requirements: (row.requirements as Record<string, BuyerField<unknown>> | null) ?? null,
    financial: (row.financial as Record<string, BuyerField<unknown>> | null) ?? null,
    purposes: row.purposes ?? [],
    motivations:
      (row.motivations as { id: string; label: string; tier: "primary" | "secondary"; evidence: string[] }[] | null) ??
      null,
    priorities: (row.priorities as BuyerPriority[] | null) ?? null,
    preferences: (row.preferences as Record<string, unknown> | null) ?? null,

    intentLevel: row.intentLevel,
    intentReasons: (row.intentReasons as string[] | null) ?? null,
    intentUpdatedAt: row.intentUpdatedAt?.getTime() ?? null,

    purchaseReadiness: row.purchaseReadiness,
    purchaseReadinessConfidence: row.purchaseReadinessConfidence,
    purchaseReadinessSignals: (row.purchaseReadinessSignals as string[] | null) ?? null,

    lastInteractionAt: row.lastInteractionAt?.getTime() ?? null,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

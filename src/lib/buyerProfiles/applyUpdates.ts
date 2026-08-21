import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import type { BuyerField } from "@/core/buyerIntelligence/types";

export interface BuyerProfileFieldUpdate {
  requirements?: Record<string, BuyerField<unknown>> | null;
  financial?: Record<string, BuyerField<unknown>> | null;
  purposes?: string[];
  motivations?: unknown;
  priorities?: unknown;
}

/**
 * Shared by the PATCH route and the conversation-note confirm/edit flow:
 * detects a requirements/financial write that overwrites a previously-set
 * value and records it as a BuyerRequirementChange row before applying the
 * update — never silently overwritten (spec §12), regardless of which
 * surface produced the edit.
 */
export async function applyBuyerProfileFieldUpdate(params: {
  buyerProfileId: string;
  tenantId: string;
  existing: {
    requirements: unknown;
    financial: unknown;
  };
  update: BuyerProfileFieldUpdate;
  source: string;
}): Promise<void> {
  const { buyerProfileId, tenantId, existing, update, source } = params;

  const changes: { field: string; previousValue: unknown; newValue: unknown }[] = [];
  for (const category of ["requirements", "financial"] as const) {
    const incoming = update[category];
    if (!incoming) continue;
    const before = (existing[category] as Record<string, BuyerField<unknown>> | null) ?? {};
    for (const [key, field] of Object.entries(incoming)) {
      const prev = before[key];
      if (prev && JSON.stringify(prev.value) !== JSON.stringify(field.value)) {
        changes.push({ field: `${category}.${key}`, previousValue: prev.value, newValue: field.value });
      }
    }
  }

  await prisma.buyerProfile.updateMany({
    where: { id: buyerProfileId },
    data: update as unknown as Prisma.BuyerProfileUpdateManyMutationInput,
  });

  if (changes.length > 0) {
    await prisma.buyerRequirementChange.createMany({
      data: changes.map((c) => ({
        buyerProfileId,
        tenantId,
        field: c.field,
        previousValue: c.previousValue as Prisma.InputJsonValue,
        newValue: c.newValue as Prisma.InputJsonValue,
        source,
      })),
    });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { buildBuyerProfileScope } from "@/lib/buyerProfiles/scope";
import { findSimilarBuyers, type SimilarityCandidate } from "@/core/buyerIntelligence/similarity";
import type { BuyerPriority } from "@/core/buyerIntelligence/priorityWeights";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toCandidate(row: {
  id: string;
  name: string;
  purposes: string[];
  priorities: unknown;
  intentLevel: string | null;
  purchaseReadiness: string | null;
}): SimilarityCandidate {
  return {
    id: row.id,
    name: row.name,
    purposes: row.purposes,
    priorities: row.priorities as BuyerPriority[] | null,
    intentLevel: row.intentLevel,
    purchaseReadiness: row.purchaseReadiness,
  };
}

/**
 * Buyer similarity (Wave 2) — computed on demand, never stored, and capped
 * to the same access scope as everything else in Buyer Intelligence (a
 * Salesperson never sees a "similar buyer" outside their own branch/
 * assignment). See findSimilarBuyers for the scoring and why financial
 * fields are deliberately excluded.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("buyer-intelligence.view");
    const { id } = await params;
    const scope = buildBuyerProfileScope(ctx);

    const target = await prisma.buyerProfile.findFirst({
      where: { id, ...scope },
      select: { id: true, name: true, purposes: true, priorities: true, intentLevel: true, purchaseReadiness: true },
    });
    if (!target) return NextResponse.json({ error: "not-found" }, { status: 404 });

    const candidates = await prisma.buyerProfile.findMany({
      where: { ...scope, id: { not: id } },
      select: { id: true, name: true, purposes: true, priorities: true, intentLevel: true, purchaseReadiness: true },
      take: 500,
    });

    const matches = findSimilarBuyers(toCandidate(target), candidates.map(toCandidate));
    return NextResponse.json({ matches });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

import type { Prisma } from "@/generated/prisma/client";
import type { BuyerPriority } from "@/core/buyerIntelligence/priorityWeights";

/**
 * Wave 2 buyer segmentation — a segment is a saved, declarative filter
 * (`BuyerSegmentCriterion[]`), never a stored membership snapshot. Mirrors
 * the codebase's one existing "serializable rule" convention (`RuleSpec` /
 * `compileRule`, src/core/industries/rules.ts): a plain-data spec compiled
 * on demand, so a segment's buyer count is always live and never goes stale
 * as buyer state changes.
 */

export type BuyerSegmentField =
  | "intentLevel"
  | "purchaseReadiness"
  | "purpose"
  | "priorityRequirement"
  | "assignedToId"
  | "branchId";

export const SEGMENT_FIELD_INFO: Record<BuyerSegmentField, { label: string; op: "eq" | "includes" }> = {
  intentLevel: { label: "Intent level", op: "eq" },
  purchaseReadiness: { label: "Purchase readiness", op: "eq" },
  purpose: { label: "Purpose", op: "includes" },
  priorityRequirement: { label: "Priority requirement", op: "includes" },
  assignedToId: { label: "Assigned to", op: "eq" },
  branchId: { label: "Branch", op: "eq" },
};

export interface BuyerSegmentCriterion {
  field: BuyerSegmentField;
  value: string;
}

/**
 * Compiles every criterion that maps cleanly onto a Prisma `where` clause —
 * everything except `priorityRequirement`, whose value lives inside a JSON
 * array of `{ requirement, importance }` objects. Postgres/Prisma JSON
 * `array_contains` only matches a *whole* element by deep equality, so it
 * can't express "some element's requirement field equals X" without also
 * pinning down `importance` — a real filter would silently under-match.
 * `priorityRequirement` criteria are applied afterward in JS via
 * `matchesJsOnlyCriteria`, against the rows this `where` already narrowed
 * down (still scoped by `buildBuyerProfileScope`, composed via `AND` here
 * the same as everywhere else in Buyer Intelligence).
 */
export function compileSegmentWhere(criteria: BuyerSegmentCriterion[]): Prisma.BuyerProfileWhereInput {
  const clauses: Prisma.BuyerProfileWhereInput[] = [];
  for (const c of criteria) {
    switch (c.field) {
      case "intentLevel":
        clauses.push({ intentLevel: c.value });
        break;
      case "purchaseReadiness":
        clauses.push({ purchaseReadiness: c.value });
        break;
      case "purpose":
        clauses.push({ purposes: { has: c.value } });
        break;
      case "assignedToId":
        clauses.push({ assignedToId: c.value });
        break;
      case "branchId":
        clauses.push({ branchId: c.value });
        break;
      case "priorityRequirement":
        break; // handled in JS — see matchesJsOnlyCriteria
    }
  }
  return clauses.length > 0 ? { AND: clauses } : {};
}

/** The `priorityRequirement` half of a segment's criteria — see compileSegmentWhere. */
export function matchesJsOnlyCriteria(
  profile: { priorities: BuyerPriority[] | null },
  criteria: BuyerSegmentCriterion[],
): boolean {
  const priorityCriteria = criteria.filter((c) => c.field === "priorityRequirement");
  if (priorityCriteria.length === 0) return true;
  const priorities = profile.priorities ?? [];
  return priorityCriteria.every((c) => priorities.some((p) => p.requirement === c.value));
}

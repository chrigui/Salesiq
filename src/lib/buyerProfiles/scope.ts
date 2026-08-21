import type { Prisma } from "@/generated/prisma/client";
import type { SessionContext } from "@/lib/auth/server";

/**
 * Row-level access scoping for Buyer Intelligence — new for this module,
 * not an existing pattern (every other route in the app is tenant-wide once
 * the capability check passes). Salesperson/Designer-tier roles see only
 * buyers in their own branch or explicitly assigned to them; Manager/Admin/
 * Owner see the full tenant. Layered on top of, not instead of, the
 * ordinary requireCapability("buyer-intelligence.view") check.
 */
export function buildBuyerProfileScope(ctx: SessionContext): Prisma.BuyerProfileWhereInput {
  const base: Prisma.BuyerProfileWhereInput = { tenantId: ctx.tenantId };
  if (ctx.role === "Owner" || ctx.role === "Admin" || ctx.role === "Manager") {
    return base;
  }
  return {
    ...base,
    OR: [
      ...(ctx.branchId ? [{ branchId: ctx.branchId }] : []),
      { assignedToId: ctx.userId },
    ],
  };
}

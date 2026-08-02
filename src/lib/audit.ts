import "server-only";
import { prisma } from "@/lib/db";

/**
 * The first real, DB-backed audit writer in the app — core/data/auditLog.ts's
 * "logAudit()" is localStorage-only despite its doc comment's claims (see
 * the Brochure module's plan notes), so it isn't reused here. This writes
 * the existing, previously-unused TenantAuditEntry model, scoped to
 * brochure actions for now rather than a platform-wide audit overhaul.
 */
export async function logTenantAudit(params: {
  tenantId: string;
  actor: string;
  action: string;
  target: string;
  detail: string;
}): Promise<void> {
  await prisma.tenantAuditEntry.create({ data: params });
}

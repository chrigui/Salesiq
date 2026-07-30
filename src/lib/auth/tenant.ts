import "server-only";
import { prisma } from "@/lib/db";

/**
 * Resolves "the" tenant for this pilot deployment. Real multi-tenant
 * routing (subdomain/host-based) is a later concern — for now every
 * unauthenticated write and every login attempt resolves against
 * DEFAULT_TENANT_SLUG.
 */
export async function getDefaultTenant() {
  const slug = process.env.DEFAULT_TENANT_SLUG;
  if (!slug) throw new Error("DEFAULT_TENANT_SLUG is not set.");
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) throw new Error(`Default tenant "${slug}" not found — has the DB been seeded?`);
  return tenant;
}

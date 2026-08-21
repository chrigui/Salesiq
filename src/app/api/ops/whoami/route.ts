import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * TEMPORARY diagnostic (delete once the production login mismatch is
 * resolved): reports what this exact deployment resolves DEFAULT_TENANT_SLUG
 * to, and whether a given email exists under that tenant — none of this is
 * sensitive (slugs, ids, booleans, names), reusing the same secret gate as
 * the seed trigger so it's not publicly open.
 */
export async function GET(request: NextRequest) {
  const configured = process.env.SEED_TRIGGER_SECRET;
  const provided = request.nextUrl.searchParams.get("secret");
  if (!configured || !provided || !secretsMatch(configured, provided)) {
    return new NextResponse(null, { status: 404 });
  }

  const email = (request.nextUrl.searchParams.get("email") ?? "sara@greenhills.example")
    .trim()
    .toLowerCase();
  const slug = process.env.DEFAULT_TENANT_SLUG;

  const diagnostic: Record<string, unknown> = {
    defaultTenantSlugConfigured: Boolean(slug),
    defaultTenantSlugValue: slug ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
  };

  if (!slug) {
    diagnostic.result = "DEFAULT_TENANT_SLUG is unset on this deployment.";
    return NextResponse.json(diagnostic);
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  diagnostic.tenantFound = Boolean(tenant);
  diagnostic.tenantId = tenant?.id ?? null;
  diagnostic.tenantSlug = tenant?.slug ?? null;
  diagnostic.tenantName = tenant?.name ?? null;

  if (!tenant) {
    diagnostic.result = `No tenant row with slug "${slug}" exists in this deployment's database.`;
    return NextResponse.json(diagnostic);
  }

  const userCount = await prisma.user.count({ where: { tenantId: tenant.id } });
  const user = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email } },
  });
  diagnostic.userCountInTenant = userCount;
  diagnostic.lookedUpEmail = email;
  diagnostic.userFound = Boolean(user);
  diagnostic.userStatus = user?.status ?? null;
  diagnostic.result = user
    ? "This exact user resolves correctly — login should work."
    : "Tenant resolves, but no user row matches this email under it.";

  return NextResponse.json(diagnostic);
}

function secretsMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { HARDCODED_DEMO_EMAIL, HARDCODED_DEMO_PASSWORD } from "@/core/data/demoLogin";

/**
 * A guaranteed-to-work login, independent of DEFAULT_TENANT_SLUG and of
 * whether prisma/seed.ts has ever been run against this database. The
 * pilot's normal login depends on both — a deploy with an unset/mismatched
 * DEFAULT_TENANT_SLUG or a database that was never seeded fails every real
 * login attempt with no way in. This account self-provisions its own
 * dedicated tenant + user on first use (every write is an upsert, so
 * calling this repeatedly is harmless), then behaves exactly like any other
 * account from then on — a real session, a real (Owner) role, nothing
 * faked. It never touches the tenant DEFAULT_TENANT_SLUG resolves to, so it
 * can't be used to reach another tenant's real seeded data.
 */
const DEMO_TENANT_SLUG = "salesiq-hardcoded-demo";

export function isHardcodedDemoLogin(email: string, password: string): boolean {
  return email === HARDCODED_DEMO_EMAIL && password === HARDCODED_DEMO_PASSWORD;
}

export async function ensureHardcodedDemoAccount() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: DEMO_TENANT_SLUG },
    update: {},
    create: {
      slug: DEMO_TENANT_SLUG,
      name: "SalesIQ Demo",
      tagline: "Explore SalesIQ with a working demo account.",
      workingHours: { days: ["Mon", "Tue", "Wed", "Thu", "Fri"], open: "09:00", close: "18:00" },
      businessUnits: ["Demo"],
      vertical: "real-estate",
    },
  });

  const passwordHash = await bcrypt.hash(HARDCODED_DEMO_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: HARDCODED_DEMO_EMAIL } },
    // Re-assert the hash and active status on every login too, so this
    // account can never drift into a state where it stops working (e.g. if
    // someone changed its password or suspended it through the console).
    update: { passwordHash, status: "active", mfaEnabled: false },
    create: {
      tenantId: tenant.id,
      name: "Demo User",
      email: HARDCODED_DEMO_EMAIL,
      passwordHash,
      role: "Owner",
      status: "active",
      mfaEnabled: false,
    },
  });

  return { tenant, user };
}

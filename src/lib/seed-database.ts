import bcrypt from "bcryptjs";
import type { PrismaClient } from "@/generated/prisma/client";

/**
 * The pilot demo dataset — idempotent (every write is an upsert), safe to
 * rerun any number of times. Shared by prisma/seed.ts (the CLI entry point,
 * `npm run db:seed`) and src/app/api/ops/seed/route.ts (a remote trigger for
 * environments where running the CLI locally isn't practical, e.g. a fresh
 * Vercel deploy reached from a machine without this repo cloned) so the two
 * paths can never drift out of sync.
 */
const WORKING_HOURS_HQ = { days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], open: "09:00", close: "18:00" };
const WORKING_HOURS_LIM = { days: ["Mon", "Tue", "Wed", "Thu", "Fri"], open: "09:00", close: "19:00" };
const WORKING_HOURS_PFO = { days: ["Mon", "Tue", "Wed", "Thu", "Fri"], open: "10:00", close: "17:00" };

const CAPABILITIES = [
  "inventory.view",
  "inventory.edit",
  "inventory.delete",
  "questions.edit",
  "scoring.edit",
  "branding.edit",
  "ai.manage",
  "packs.create",
  "leads.view",
  "leads.edit",
  "leads.export",
  "analytics.view",
  "branches.manage",
  "users.manage",
  "billing.manage",
  "security.manage",
];

const MANAGER_SET = CAPABILITIES.filter(
  (id) => !["billing.manage", "users.manage", "branches.manage", "security.manage"].includes(id),
);
const SALES_SET = ["inventory.view", "questions.edit", "leads.view", "leads.edit", "analytics.view"];
const VIEWER_SET = ["inventory.view", "leads.view", "analytics.view"];

const ROLE_GRANTS: Record<string, string[]> = {
  Owner: CAPABILITIES,
  Admin: CAPABILITIES,
  Manager: MANAGER_SET,
  Salesperson: SALES_SET,
  Viewer: VIEWER_SET,
};

export interface SeedSummary {
  tenantSlug: string;
  tenantId: string;
  branchCount: number;
  userCount: number;
  permissionCount: number;
}

export async function seedDatabase(prisma: PrismaClient): Promise<SeedSummary> {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "green-hills" },
    update: {},
    create: {
      slug: "green-hills",
      name: "Green Hills Living",
      legalName: "Green Hills Living Ltd.",
      logoGlyph: "◈",
      tagline: "Find the home your life is asking for.",
      defaultLanguage: "en",
      defaultCurrency: "USD",
      timezone: "Asia/Nicosia",
      address: "Larnaca, Cyprus",
      workingHours: WORKING_HOURS_HQ,
      businessUnits: ["Residential Sales", "Investment"],
      plan: "Growth",
      seats: 10,
      mrr: 1490,
      health: "healthy",
      vertical: "real-estate",
    },
  });

  const branches = [
    {
      id: "br-larnaca",
      name: "Larnaca HQ",
      code: "LCA",
      address: "Finikoudes Ave, Larnaca, Cyprus",
      lat: 34.9182,
      lng: 33.6362,
      phone: "+357 24 000 000",
      status: "active",
      workingHours: WORKING_HOURS_HQ,
      teamSize: 12,
      displays: 3,
      companions: 8,
    },
    {
      id: "br-limassol",
      name: "Limassol Marina",
      code: "LIM",
      address: "Marina District, Limassol, Cyprus",
      lat: 34.6786,
      lng: 33.0413,
      phone: "+357 25 000 000",
      status: "active",
      workingHours: WORKING_HOURS_LIM,
      teamSize: 7,
      displays: 2,
      companions: 5,
    },
    {
      id: "br-paphos",
      name: "Paphos Hills",
      code: "PFO",
      address: "Coral Bay Rd, Paphos, Cyprus",
      lat: 34.7754,
      lng: 32.4245,
      phone: "+357 26 000 000",
      status: "inactive",
      workingHours: WORKING_HOURS_PFO,
      teamSize: 3,
      displays: 1,
      companions: 2,
    },
  ];

  for (const b of branches) {
    await prisma.branch.upsert({
      where: { id: b.id },
      update: {},
      create: { ...b, tenantId: tenant.id },
    });
  }

  const password = process.env.SEED_DEMO_PASSWORD ?? "demo1234";
  const passwordHash = await bcrypt.hash(password, 12);
  const now = Date.now();

  const users = [
    {
      id: "u-sara",
      name: "Sara Haddad",
      email: "sara@greenhills.example",
      role: "Owner" as const,
      branchId: "br-larnaca",
      status: "active" as const,
      mfaEnabled: true,
      lastLoginAt: new Date(now - 1000 * 60 * 12),
      device: "iPhone 16 Pro · Companion",
    },
    {
      id: "u-marco",
      name: "Marco Ionescu",
      email: "marco@greenhills.example",
      role: "Manager" as const,
      branchId: "br-limassol",
      status: "active" as const,
      mfaEnabled: true,
      lastLoginAt: new Date(now - 1000 * 60 * 60 * 3),
      device: "Samsung Tab S9 · Companion",
    },
    {
      id: "u-elif",
      name: "Elif Demir",
      email: "elif@greenhills.example",
      role: "Salesperson" as const,
      branchId: "br-larnaca",
      status: "active" as const,
      mfaEnabled: false,
      lastLoginAt: new Date(now - 1000 * 60 * 60 * 26),
      device: "iPhone 15 · Companion",
    },
    {
      id: "u-noah",
      name: "Noah Petrides",
      email: "noah@greenhills.example",
      role: "Salesperson" as const,
      branchId: "br-paphos",
      status: "invited" as const,
      mfaEnabled: false,
      lastLoginAt: null,
      device: null,
    },
    {
      id: "u-review",
      name: "External Auditor",
      email: "auditor@partner.example",
      role: "Viewer" as const,
      branchId: null,
      status: "suspended" as const,
      mfaEnabled: true,
      lastLoginAt: new Date(now - 1000 * 60 * 60 * 24 * 60),
      device: null,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: { ...u, tenantId: tenant.id, passwordHash },
    });
  }

  for (const [role, grantedIds] of Object.entries(ROLE_GRANTS)) {
    for (const capabilityId of CAPABILITIES) {
      await prisma.rolePermission.upsert({
        where: { tenantId_role_capabilityId: { tenantId: tenant.id, role: role as never, capabilityId } },
        update: { granted: grantedIds.includes(capabilityId) },
        create: {
          tenantId: tenant.id,
          role: role as never,
          capabilityId,
          granted: grantedIds.includes(capabilityId),
        },
      });
    }
  }

  // Deliberately no leads seeded — the empty-lead state is a tested product
  // behavior (see tests/e2e/business-impact.spec.ts), not a gap to fill.

  return {
    tenantSlug: tenant.slug,
    tenantId: tenant.id,
    branchCount: branches.length,
    userCount: users.length,
    permissionCount: CAPABILITIES.length * Object.keys(ROLE_GRANTS).length,
  };
}

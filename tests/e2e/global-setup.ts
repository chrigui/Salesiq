import { execSync } from "node:child_process";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://salesiq:salesiq@localhost:5432/salesiq_test?schema=public";

/**
 * Runs once before the whole Playwright suite: applies the current schema
 * to the dedicated test database and seeds its baseline data. Uses
 * `migrate deploy` (safe, additive, idempotent — never destructive), not
 * `migrate reset`, so this can run unattended in CI with no consent
 * prompt. Per-test isolation (clearing leads/sessions between tests) is a
 * separate, lighter step — see resetTestData() in ./reset.ts.
 */
export default async function globalSetup() {
  const env = { ...process.env, DATABASE_URL: TEST_DATABASE_URL };
  execSync("npx prisma migrate deploy", { stdio: "inherit", env });
  execSync("npx prisma db seed", { stdio: "inherit", env });
}

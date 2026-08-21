/**
 * A hardcoded, always-works demo login — client-safe constants only (no
 * "server-only" import, so the sign-in screen can show them unconditionally,
 * without depending on a DB round trip that itself might be the thing
 * that's broken). The account these name is self-provisioning: see
 * src/lib/auth/demoLogin.ts for the server-side upsert that creates it (in
 * its own dedicated tenant, decoupled from DEFAULT_TENANT_SLUG) the first
 * time anyone actually signs in with them, so this works even against a
 * freshly-deployed database that was never seeded.
 */
export const HARDCODED_DEMO_EMAIL = "demo@salesiq.app";
export const HARDCODED_DEMO_PASSWORD = "SalesIQDemo!1";

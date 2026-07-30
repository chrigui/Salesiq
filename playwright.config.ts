import { defineConfig, devices } from "@playwright/test";

/**
 * Locally (this sandbox) reuses the pre-installed Chromium at
 * /opt/pw-browsers instead of downloading one. In CI (no /opt/pw-browsers),
 * `playwright install --with-deps chromium` provides its own browser and
 * this falls back to Playwright's default executable.
 *
 * The e2e server runs a production build on its own port (3001), separate
 * from a developer's own `npm run dev` on 3000, against a dedicated
 * `salesiq_test` database — never the dev database. Two reasons: (1) a
 * `next dev` server recompiles routes on first hit, which was flaky
 * against Playwright's default timeouts once auth became real network
 * round-trips; (2) real Postgres means state persists across tests, so
 * test data must never leak into (or be reset from under) a developer's
 * own dev database. See tests/e2e/global-setup.ts and reset.ts for the
 * schema/seed/per-test reset story.
 */
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://salesiq:salesiq@localhost:5432/salesiq_test?schema=public";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : "html",
  use: {
    baseURL: "http://localhost:3001",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1600, height: 1000 },
        launchOptions: process.env.CI
          ? {}
          : { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium" },
      },
    },
  ],
  webServer: {
    command: "npm run build && npm run start:test",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      AUTH_SECRET: process.env.AUTH_SECRET ?? "test-secret-not-for-production-0000000000000000",
      DEFAULT_TENANT_SLUG: "green-hills",
      SHOW_DEMO_LOGINS: "true",
      ALLOW_TEST_RESET: "true",
    },
  },
});

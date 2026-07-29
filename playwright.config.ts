import { defineConfig, devices } from "@playwright/test";

/**
 * Locally (this sandbox) reuses the pre-installed Chromium at
 * /opt/pw-browsers instead of downloading one. In CI (no /opt/pw-browsers),
 * `playwright install --with-deps chromium` provides its own browser and
 * this falls back to Playwright's default executable.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : "html",
  use: {
    baseURL: "http://localhost:3000",
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
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

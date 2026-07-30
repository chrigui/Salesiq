import { defineConfig, devices } from "@playwright/test";

/**
 * Runs against a production build (`next build && next start`), on its own
 * port (3200) — distinct from the product app's dev (3000) and e2e (3001)
 * ports so both suites can run side by side without colliding. No database
 * is involved: this app has none.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : "html",
  use: {
    baseURL: "http://localhost:3200",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 },
        launchOptions: process.env.CI
          ? {}
          : { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium" },
      },
    },
  ],
  webServer: {
    command: "npm run build && npm run start:test",
    url: "http://localhost:3200",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});

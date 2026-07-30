import { test, expect } from "@playwright/test";
import { login } from "./helpers";
import { resetTestData } from "./reset";

test.beforeEach(resetTestData);

const screens: { navLabel: string; heading: string | RegExp }[] = [
  { navLabel: "Overview", heading: "Overview" },
  { navLabel: "Leads", heading: "Leads" },
  { navLabel: "Analytics", heading: "Analytics" },
  { navLabel: "Security & Compliance", heading: "Security & Compliance" },
  { navLabel: "Marketplace", heading: "Marketplace" },
  { navLabel: "Developer Platform", heading: "Developer Platform" },
  { navLabel: "Getting Started", heading: "Getting Started" },
  { navLabel: "Help Center", heading: "Help Center" },
];

test.beforeEach(async ({ page }) => {
  await login(page);
});

for (const { navLabel, heading } of screens) {
  test(`navigates to ${navLabel} without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.getByRole("button", { name: navLabel, exact: true }).click();
    await expect(page.getByText(heading, { exact: true }).first()).toBeVisible({ timeout: 10_000 });

    expect(errors).toEqual([]);
  });
}

test("Marketplace 'Open in builder' routes into the Question Builder", async ({ page }) => {
  await page.getByRole("button", { name: "Marketplace", exact: true }).click();
  await page.getByRole("button", { name: /open in builder/i }).first().click();
  await expect(page.getByText("Questions", { exact: true }).first()).toBeVisible({ timeout: 5000 });
});

import { test, expect } from "@playwright/test";
import { collectErrors, LIVE_PAGES } from "./helpers";

for (const path of LIVE_PAGES) {
  test(`${path || "home"} loads without console errors`, async ({ page }) => {
    const errors = collectErrors(page);
    const response = await page.goto(path);
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("h1")).toBeVisible();
    expect(errors, `console errors on ${path}: ${errors.join(", ")}`).toEqual([]);
  });
}

test("robots.txt and sitemap.xml are served", async ({ page }) => {
  const robots = await page.goto("/robots.txt");
  expect(robots?.status()).toBe(200);
  const sitemap = await page.goto("/sitemap.xml");
  expect(sitemap?.status()).toBe(200);
  expect(await sitemap?.text()).toContain("<urlset");
});

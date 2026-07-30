import { test, expect } from "@playwright/test";

test("mega menu opens and links to a live page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Platform/i }).click();
  const link = page.locator("header").getByRole("link", { name: "Platform overview" });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/platform$/);
});

test("theme toggle switches to dark mode", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("command palette opens via the search button and navigates on selection", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByPlaceholder("Search pages…").fill("Pricing");
  await page.getByRole("button", { name: /Pricing/ }).click();
  await expect(page).toHaveURL(/\/pricing$/);
});

test("mobile menu opens on a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("link", { name: "Book a demo" }).last()).toBeVisible();
});

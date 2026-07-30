import { test, expect } from "@playwright/test";

test("shows validation errors on an empty submit", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "Request a demo" }).click();
  await expect(page.getByText("Enter your full name.")).toBeVisible();
  await expect(page.getByText("Enter a valid work email.")).toBeVisible();
});

test("submits successfully with valid data", async ({ page }) => {
  await page.goto("/demo");
  await page.getByLabel("Full name").fill("Jordan Blake");
  await page.getByLabel("Work email").fill("jordan@northbridgerealty.com");
  await page.getByLabel("Company", { exact: true }).fill("Northbridge Realty Group");

  await page.getByLabel("Company size").click();
  await page.getByRole("option", { name: "51–250 employees" }).click();

  await page.getByLabel("Industry").click();
  await page.getByRole("option", { name: "Real estate" }).click();

  await page.getByRole("button", { name: "Request a demo" }).click();
  await expect(page.getByText("Request received.")).toBeVisible();
});

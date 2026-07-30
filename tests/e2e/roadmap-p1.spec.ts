import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("Decision Simulator recomputes the top pick locally without touching the real session", async ({ page }) => {
  await page.goto("/companion");
  await page.getByText("Load demo", { exact: true }).click();

  await page.getByRole("button", { name: "Decision simulator" }).click();
  await expect(page.getByText("Simulated result")).toBeVisible();

  // Reset button only appears once a control has actually been dragged away
  // from the real answers — confirms the simulator starts clean/undirtied.
  await expect(page.getByRole("button", { name: "Reset to real answers" })).toHaveCount(0);
});

test("ROI Calculator computes transparent, editable formulas from default inputs", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "ROI Calculator", exact: true }).click();

  await expect(page.getByText("Additional annual revenue").first()).toBeVisible();
  // Defaults: 50 leads x 20% close x 15% lift x $15,000 x 12 = $270,000.
  await expect(page.getByText("$270,000").first()).toBeVisible();
  // 50 leads x 3 hrs x 70% reduction x 12 = 1,260 hours saved annually.
  await expect(page.getByText("1,260").first()).toBeVisible();
  await expect(page.getByText("How this is calculated")).toBeVisible();
});

test("Deal Probability Radar shows an honest empty state with no leads", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Deal Probability", exact: true }).click();
  await expect(page.getByText("No leads captured yet")).toBeVisible();
});

test("Deal Probability Radar computes a real probability from a captured lead", async ({ context }) => {
  const companion = await context.newPage();
  const dashboard = await context.newPage();

  await companion.goto("/companion");
  await companion.getByText("Load demo", { exact: true }).click();
  await companion.getByText("Proposal", { exact: true }).click();
  await companion.getByRole("button", { name: /save lead to crm/i }).click();
  await expect(companion.getByText("Saved to CRM")).toBeVisible();

  await login(dashboard);
  await dashboard.getByRole("button", { name: "Deal Probability", exact: true }).click();
  await expect(dashboard.getByText("Open opportunities")).toBeVisible();
  // status=new (base 20) blended with a real match score of 92: round(20*0.6+92*0.4)=49% -> Warm.
  await expect(dashboard.getByText("49%")).toBeVisible();
  await expect(dashboard.getByText("Warm")).toBeVisible();
  // Risk-adjusted pipeline = $285,000 * 0.49 = $139,650.
  await expect(dashboard.getByText("$139,650")).toBeVisible();
});

import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("Sales Copilot shows a clean session with no signals by default", async ({ page }) => {
  await page.goto("/companion");
  await page.getByText("Load demo", { exact: true }).click();
  await page.getByRole("button", { name: "Sales copilot" }).click();
  await expect(page.getByText("No signals right now")).toBeVisible();
});

test("Sales Copilot detects real bookmarking as a comparison-shopping signal", async ({ page }) => {
  await page.goto("/companion");
  await page.getByText("Load demo", { exact: true }).click();

  const toggles = page.locator('span[role="button"]:has(svg.lucide-bookmark)');
  await toggles.nth(0).click();
  await toggles.nth(1).click();

  await page.getByRole("button", { name: "Sales copilot" }).click();
  await expect(page.getByText("Comparing multiple options")).toBeVisible();
  await expect(page.getByText("2 items bookmarked")).toBeVisible();
});

test("Sales Copilot detects repeated real objections from the timeline", async ({ page }) => {
  await page.goto("/companion");
  await page.getByText("Load demo", { exact: true }).click();

  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "Objection handler" }).click();
    await page.locator('button:has-text("expensive")').first().click();
    await page.waitForTimeout(800);
    await page.locator('button:has(svg.lucide-x)').first().click();
  }

  await page.getByRole("button", { name: "Sales copilot" }).click();
  await expect(page.getByText("Multiple objections raised")).toBeVisible();

  // Hands off to the existing reactive tool rather than duplicating it.
  await page.getByRole("button", { name: "Open objection handler" }).click();
  await expect(page.getByText("Objection handler", { exact: true })).toBeVisible();
});

test("Sales Twin reads real progress, budget posture and decision drivers off the demo session", async ({ page }) => {
  await page.goto("/companion");
  await page.getByText("Load demo", { exact: true }).click();
  await page.getByRole("button", { name: "Sales twin" }).click();

  await expect(page.getByText("Questionnaire progress")).toBeVisible();
  await expect(page.getByText("Flexible")).toBeVisible();
  await expect(page.getByText("High")).toBeVisible();
  await expect(page.getByText("Budget", { exact: true }).first()).toBeVisible();
});

test("Buying Committee lets a salesperson track and remove real stakeholders", async ({ page }) => {
  await page.goto("/companion");
  await page.getByText("Load demo", { exact: true }).click();
  await page.getByText("Sara Haddad", { exact: true }).click();

  // Demo seeds one real stakeholder — not fabricated on the fly, part of the
  // same intentional "Load demo" scenario as the customer contact.
  await expect(page.getByText("Karim Haddad")).toBeVisible();

  await page.getByPlaceholder("Name", { exact: true }).fill("Nadia Khoury");
  await page.getByPlaceholder("Role (e.g. Economic buyer)").fill("Champion");
  await page.getByLabel("Add stakeholder").click();
  await expect(page.getByText("Nadia Khoury")).toBeVisible();

  await page.getByLabel("Remove Karim Haddad").click();
  await expect(page.getByText("Karim Haddad")).toHaveCount(0);
});

test("AI Meeting Replay recaps the real session and jumps the shared display to that moment", async ({ context }) => {
  const companion = await context.newPage();
  const display = await context.newPage();

  await display.goto("/display");
  await companion.goto("/companion");
  await companion.getByText("Load demo", { exact: true }).click();

  const toggles = companion.locator('span[role="button"]:has(svg.lucide-bookmark)');
  await toggles.nth(0).click();

  await companion.getByRole("button", { name: "Session timeline" }).click();
  await expect(companion.getByText("Session recap")).toBeVisible();
  await expect(companion.getByText(/interactions? recorded\./)).toBeVisible();

  await companion.getByLabel("Jump to this moment").first().click();
  await expect(display.getByText("Green Hills", { exact: true }).first()).toBeVisible({ timeout: 5000 });
});

test("Guided Demo Mode drives the real session through each scripted beat", async ({ page }) => {
  await page.goto("/companion");
  await page.getByRole("button", { name: "Guided demo" }).click();

  await expect(page.getByText("Load the scenario")).toBeVisible();
  await expect(page.getByText("1/7")).toBeVisible();
  // Step 1 actually calls session.loadDemo() — real state, not a screenshot.
  await expect(page.getByText("Green Hills", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("The recommendation")).toBeVisible();

  // Step 4 opens the real Decision Simulator, not a mock of it.
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "Next", exact: true }).click();
  }
  await expect(page.getByText("What if the budget moves?")).toBeVisible();
  await expect(page.getByText("Decision simulator", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Exit guided demo" }).click();
  await expect(page.getByText("Guided demo · ")).toHaveCount(0);
});

import type { Page } from "@playwright/test";

/** Collects console.error and uncaught page errors for a page. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));
  return errors;
}

export const LIVE_PAGES = ["/", "/platform", "/decision-intelligence", "/pricing", "/demo"];

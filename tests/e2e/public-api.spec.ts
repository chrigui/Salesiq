import { test, expect } from "@playwright/test";

test("GET /api/public/v1/packs lists shipped packs", async ({ request }) => {
  const res = await request.get("/api/public/v1/packs");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(Array.isArray(body.packs)).toBe(true);
  expect(body.packs.length).toBeGreaterThan(0);
  expect(body.packs.map((p: { id: string }) => p.id)).toContain("real-estate");
});

test("POST /api/public/v1/packs/real-estate/recommend scores real inventory", async ({ request }) => {
  const res = await request.post("/api/public/v1/packs/real-estate/recommend", {
    data: { answers: { household: "family", budget: { min: 200000, max: 400000 }, bedrooms: 4 } },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.packId).toBe("real-estate");
  expect(body.recommendations.length).toBeGreaterThan(0);
  expect(body.recommendations[0]).toHaveProperty("narrative");
  expect(body.recommendations[0].score).toBeGreaterThan(0);
});

test("POST recommend 404s for an unknown pack", async ({ request }) => {
  const res = await request.post("/api/public/v1/packs/not-a-real-pack/recommend", {
    data: { answers: {} },
  });
  expect(res.status()).toBe(404);
});

test("GET /manifest.webmanifest is a valid PWA manifest", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.name).toBe("SalesIQ Sales Companion");
  expect(body.icons.length).toBeGreaterThan(0);
});

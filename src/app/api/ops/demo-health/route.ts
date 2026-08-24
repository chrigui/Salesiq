import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import mqtt from "mqtt";
import { prisma } from "@/lib/db";
import { getDefaultTenant } from "@/lib/auth/tenant";
import { GOLDEN_DEMO_PACK_ID, GOLDEN_DEMO_HERO_ITEM_ID } from "@/components/companion/goldenDemoSteps";
import { getBasePack } from "@/core/industries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYNC_BROKER =
  process.env.NEXT_PUBLIC_SYNC_BROKER || "wss://broker.emqx.io:8084/mqtt";

/** Same window the dashboard's own online/offline indicator uses — see src/lib/serializers/display.ts. */
const ONLINE_WINDOW_MS = 90_000;

type CheckStatus = "pass" | "warn" | "fail" | "info";

interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

/**
 * Pre-presentation Demo Health Check for the Golden Demo Experience —
 * verifies the real services and data the 9-stage script depends on, so a
 * presenter finds out about a gap here rather than live in front of a
 * client. Same shape as the SEED_TRIGGER_SECRET-gated /api/ops/* routes
 * (see ../seed/route.ts, ../whoami/route.ts) — 404s until explicitly
 * configured, never publicly open — but gated on its own DEMO_HEALTH_SECRET
 * rather than reusing SEED_TRIGGER_SECRET. This route is meant to be called
 * automatically by the Companion's pre-presentation checklist panel, which
 * has no login of its own, so its secret is also mirrored client-side as
 * NEXT_PUBLIC_DEMO_HEALTH_SECRET; SEED_TRIGGER_SECRET also gates a
 * destructive reseed and must never be exposed client-side, which is why
 * this diagnostic (read-only, non-sensitive booleans only) gets a secret of
 * its own instead of sharing that one.
 */
export async function GET(request: NextRequest) {
  const configured = process.env.DEMO_HEALTH_SECRET;
  const provided = request.nextUrl.searchParams.get("secret");
  if (!configured || !provided || !secretsMatch(configured, provided)) {
    return new NextResponse(null, { status: 404 });
  }

  const checks: Check[] = [];

  // 1. Database connectivity — everything else needs this, so bail out early
  // (with every other check reported "fail") if it doesn't answer.
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
    checks.push({ id: "database", label: "Database connectivity", status: "pass", detail: "Reachable." });
  } catch (err) {
    checks.push({
      id: "database",
      label: "Database connectivity",
      status: "fail",
      detail: err instanceof Error ? err.message : "Could not reach the database.",
    });
  }

  if (!dbOk) {
    checks.push(
      { id: "heroListing", label: "Flagship hero listing", status: "fail", detail: "Skipped — database unreachable." },
      { id: "displayProfile", label: "Experience stage Display Studio profile", status: "fail", detail: "Skipped — database unreachable." },
      { id: "displayPairing", label: "Physical display pairing", status: "fail", detail: "Skipped — database unreachable." },
    );
  } else {
    const tenant = await getDefaultTenant().catch(() => null);
    if (!tenant) {
      checks.push({
        id: "tenant",
        label: "Default tenant",
        status: "fail",
        detail: "DEFAULT_TENANT_SLUG doesn't resolve — this is the tenant every unauthenticated Companion/Display session uses.",
      });
    } else {
      // 2. The flagship hero listing itself — real specs an admin would have entered.
      const pack = getBasePack(GOLDEN_DEMO_PACK_ID);
      const hero = pack.inventory.find((i) => i.id === GOLDEN_DEMO_HERO_ITEM_ID);
      if (!hero) {
        checks.push({
          id: "heroListing",
          label: "Flagship hero listing",
          status: "fail",
          detail: `${GOLDEN_DEMO_HERO_ITEM_ID} not found in ${GOLDEN_DEMO_PACK_ID}.`,
        });
      } else {
        const missing: string[] = [];
        if (!hero.photo) missing.push("photo");
        if (!hero.price) missing.push("price");
        if (!hero.location) missing.push("location");
        if (missing.length > 0) {
          checks.push({
            id: "heroListing",
            label: "Flagship hero listing",
            status: "fail",
            detail: `${hero.name} is missing: ${missing.join(", ")}.`,
          });
        } else {
          checks.push({
            id: "heroListing",
            label: "Flagship hero listing",
            status: "pass",
            detail: `${hero.name} has photo, price, and location.`,
          });
        }

        checks.push(
          hero.nearbyAmenities && hero.nearbyAmenities.length > 0
            ? { id: "nearbyAmenities", label: "Nearby amenities", status: "pass", detail: `${hero.nearbyAmenities.length} real amenities on file.` }
            : {
                id: "nearbyAmenities",
                label: "Nearby amenities",
                status: "warn",
                detail: "Not fetched yet — use the Inventory Builder's Locate + Find nearby amenities buttons on this listing before presenting.",
              },
        );
      }

      // 3. The Experience stage's Display Studio profile — must be Published
      // and, ideally, carry a floor-plan/brochure document.
      const profile = await prisma.displayProfile.findFirst({
        where: { tenantId: tenant.id, packId: GOLDEN_DEMO_PACK_ID, itemId: GOLDEN_DEMO_HERO_ITEM_ID, status: "Published" },
        orderBy: { publishedAt: "desc" },
        include: { assets: { select: { id: true } } },
      });
      if (!profile) {
        checks.push({
          id: "displayProfile",
          label: "Experience stage Display Studio profile",
          status: "fail",
          detail: "No Published Display Studio profile for the flagship listing — the Experience stage will fall back to the default item view.",
        });
        checks.push({
          id: "floorPlanAsset",
          label: "Floor plan / brochure document",
          status: "warn",
          detail: "Skipped — no profile to check.",
        });
      } else {
        checks.push({
          id: "displayProfile",
          label: "Experience stage Display Studio profile",
          status: "pass",
          detail: `"${profile.name}" is published (${profile.template}, ${profile.layout} layout).`,
        });
        checks.push(
          profile.assets.length > 0
            ? { id: "floorPlanAsset", label: "Floor plan / brochure document", status: "pass", detail: `${profile.assets.length} document(s) uploaded.` }
            : {
                id: "floorPlanAsset",
                label: "Floor plan / brochure document",
                status: "warn",
                detail: "None uploaded — attach a real floor plan/brochure via Display Studio's Documents panel before presenting.",
              },
        );
      }

      // 4. Physical display pairing — optional, adaptive: only a real
      // problem if a Display has actually been claimed and isn't heard from.
      const claimedDisplays = await prisma.display.findMany({
        where: { tenantId: tenant.id, deviceToken: { not: null } },
        select: { name: true, lastSeenAt: true },
      });
      if (claimedDisplays.length === 0) {
        checks.push({
          id: "displayPairing",
          label: "Physical display pairing",
          status: "info",
          detail: "No managed display claimed for this tenant — running browser-only, which is fine for a laptop/projector demo.",
        });
      } else {
        const now = Date.now();
        const online = claimedDisplays.filter((d) => d.lastSeenAt && now - d.lastSeenAt.getTime() < ONLINE_WINDOW_MS);
        checks.push(
          online.length > 0
            ? { id: "displayPairing", label: "Physical display pairing", status: "pass", detail: `${online.length}/${claimedDisplays.length} claimed display(s) online.` }
            : {
                id: "displayPairing",
                label: "Physical display pairing",
                status: "fail",
                detail: `${claimedDisplays.length} claimed display(s), none seen in the last ${Math.round(ONLINE_WINDOW_MS / 1000)}s.`,
              },
        );
      }
    }
  }

  // 5. MQTT sync broker — the real cross-device pairing transport (phone <-> display).
  checks.push(await checkMqtt());

  // 6. Proposal generation — always real, either path: Claude when a key is
  // set, the deterministic writer otherwise. Never a failure, just informational.
  checks.push(
    process.env.ANTHROPIC_API_KEY
      ? { id: "proposalEngine", label: "Proposal generation", status: "pass", detail: "ANTHROPIC_API_KEY is set — proposals are Claude-authored." }
      : { id: "proposalEngine", label: "Proposal generation", status: "info", detail: "No ANTHROPIC_API_KEY — proposals use the deterministic writer, which always works." },
  );

  const overall: CheckStatus = checks.some((c) => c.status === "fail")
    ? "fail"
    : checks.some((c) => c.status === "warn")
      ? "warn"
      : "pass";

  return NextResponse.json({ overall, checks });
}

function checkMqtt(): Promise<Check> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (check: Check) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        client.end(true);
      } catch {
        /* already closing */
      }
      resolve(check);
    };

    const timer = setTimeout(() => {
      finish({ id: "mqtt", label: "MQTT sync broker", status: "fail", detail: `Timed out connecting to ${SYNC_BROKER}.` });
    }, 5000);

    let client: mqtt.MqttClient;
    try {
      client = mqtt.connect(SYNC_BROKER, { connectTimeout: 4000, reconnectPeriod: 0 });
    } catch (err) {
      clearTimeout(timer);
      resolve({
        id: "mqtt",
        label: "MQTT sync broker",
        status: "fail",
        detail: err instanceof Error ? err.message : `Could not connect to ${SYNC_BROKER}.`,
      });
      return;
    }

    client.on("connect", () => finish({ id: "mqtt", label: "MQTT sync broker", status: "pass", detail: `Connected to ${SYNC_BROKER}.` }));
    client.on("error", (err) =>
      finish({ id: "mqtt", label: "MQTT sync broker", status: "fail", detail: err instanceof Error ? err.message : `Could not connect to ${SYNC_BROKER}.` }),
    );
  });
}

function secretsMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

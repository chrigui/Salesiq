import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { seedDatabase } from "@/lib/seed-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A remote trigger for the same idempotent seed prisma/seed.ts runs locally
 * — for the deploy environments where running the CLI isn't practical (no
 * repo cloned, no local Node setup handy). Gated on SEED_TRIGGER_SECRET
 * being both set and matching; unset by default, so this route 404s (not
 * "403 exists but denied") until someone deliberately opts in. GET, not
 * POST, so it's triggerable by just visiting the URL — safe here because
 * every write underneath is an upsert (see seedDatabase), never destructive.
 */
export async function GET(request: NextRequest) {
  const configured = process.env.SEED_TRIGGER_SECRET;
  const provided = request.nextUrl.searchParams.get("secret");

  if (!configured || !provided || !secretsMatch(configured, provided)) {
    // TEMPORARY diagnostic (remove once the deploy env var mismatch is
    // resolved): reveals only booleans/lengths, never the actual secret
    // value, so it's safe to leave visible in a response body while we
    // figure out why this deployment isn't seeing SEED_TRIGGER_SECRET.
    return NextResponse.json(
      {
        ok: false,
        error: "secret-mismatch",
        diagnostic: {
          deploymentHasSecretConfigured: Boolean(configured),
          configuredSecretLength: configured?.length ?? 0,
          requestProvidedSecret: Boolean(provided),
          providedSecretLength: provided?.length ?? 0,
          vercelEnv: process.env.VERCEL_ENV ?? null,
          gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
        },
      },
      { status: 404 },
    );
  }

  const summary = await seedDatabase(prisma);
  return NextResponse.json({ ok: true, ...summary });
}

function secretsMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

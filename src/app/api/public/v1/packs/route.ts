import { NextResponse } from "next/server";
import { PACKS } from "@/core/industries";

/**
 * Public API (Module 12 · Future Platform).
 *
 * GET /api/public/v1/packs -> every shipped industry pack's public shape:
 * id, label, vertical, currency, branding, and question/inventory counts.
 * Only shipped packs are servable here — a tenant's custom packs live in
 * their browser's localStorage (see core/data/customPacks.ts), which a
 * stateless serverless function has no access to. That's a real, honest
 * limitation of this pilot's architecture, not an oversight — a production
 * multi-tenant backend would resolve packs from a real database instead.
 *
 * No API key is required in this pilot — see Developer Platform in the
 * dashboard for why, and what a production deployment would add.
 */
export async function GET() {
  const packs = PACKS.map((p) => ({
    id: p.id,
    label: p.label,
    vertical: p.vertical,
    currency: p.currency,
    branding: p.branding,
    questionCount: p.questions.length,
    inventoryCount: p.inventory.length,
  }));
  return NextResponse.json({ packs });
}

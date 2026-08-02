import { NextResponse } from "next/server";
import { resolvePublicBrochure } from "@/lib/brochures/resolve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public JSON view of a published brochure — the same data the microsite
 * page itself renders (src/app/b/[slug]/page.tsx calls resolvePublicBrochure
 * directly, this route is for external/future consumers, mirroring the
 * api/public/v1/packs precedent).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolved = await resolvePublicBrochure(slug);
  if (!resolved) return NextResponse.json({ error: "not-found" }, { status: 404 });

  return NextResponse.json({
    brochure: resolved.brochure,
    packId: resolved.pack.id,
    packLabel: resolved.pack.label,
    branding: resolved.pack.branding,
    currency: resolved.pack.currency,
    item: resolved.item,
    comparables: resolved.comparables,
    assets: resolved.assets,
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { fetchWebsiteContent, WebsiteFetchError } from "@/lib/inventory/fetchWebsite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ url: z.string().min(1).max(2000) });

/**
 * Stateless by design — the Inventory Builder's item fields aren't persisted
 * server-side yet (see the InventoryItemAsset model comment), so this route
 * only fetches and extracts; the client applies the result to its own local
 * item state the same way every other manual edit in the builder already
 * works.
 */
export async function POST(request: Request) {
  try {
    await requireCapability("inventory.edit");
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid-request" }, { status: 400 });
    }

    const content = await fetchWebsiteContent(parsed.data.url);
    return NextResponse.json(content);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof WebsiteFetchError) return NextResponse.json({ error: err.code, message: err.message }, { status: 422 });
    throw err;
  }
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { resolvePublicRecap, type PublicRecapDTO } from "@/lib/recaps/resolve";
import { RECAP_TERM } from "@/lib/recaps/term";
import { BrandTokenScope, type BrandTokenInput } from "@/components/display/BrandTokenScope";
import { RecapExperienceView } from "@/components/recap-customer/RecapExperienceView";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{ code: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { code } = await params;
  const resolved = await resolvePublicRecap(code);
  if (!resolved) return { title: "Link not found" };
  const count = resolved.shortlistedProperties.length;
  return {
    title: `Your ${RECAP_TERM} — ${resolved.pack.branding.name}`,
    description: `${count} propert${count === 1 ? "y" : "ies"} picked for ${resolved.customerName || "you"}.`,
  };
}

/**
 * A Recap has no "Publish" step yet (see PR4's route — every row is minted
 * as Draft), so there is no frozen brandSnapshot to read. Resolves the live
 * brand kit instead: the one the salesperson explicitly picked at creation
 * (brandProfileId), falling back to the tenant's isDefault kit — the same
 * fallback GET /api/public/brand-profiles/default uses for the Display's
 * own generic shell. Revisit once Publish exists to freeze this at that
 * point instead of re-resolving live on every open.
 */
async function resolveBrandInput(resolved: PublicRecapDTO): Promise<BrandTokenInput | null> {
  if (resolved.brandProfileId) {
    const brandProfile = await prisma.brandProfile.findUnique({ where: { id: resolved.brandProfileId } });
    if (brandProfile) return brandProfile;
  }
  return prisma.brandProfile.findFirst({ where: { tenantId: resolved.tenantId, isDefault: true } });
}

export default async function RecapPage({ params }: { params: Params }) {
  const { code } = await params;
  const resolved = await resolvePublicRecap(code);
  if (!resolved) notFound();

  const brand = await resolveBrandInput(resolved);

  return (
    <BrandTokenScope brand={brand} className="bg-aurora min-h-screen">
      <RecapExperienceView recap={resolved} />
    </BrandTokenScope>
  );
}

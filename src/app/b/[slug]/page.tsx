import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolvePublicBrochure } from "@/lib/brochures/resolve";
import { getSessionContext, serverCan } from "@/lib/auth/server";
import { BrochureView } from "@/components/brochure/BrochureView";
import { formatMoney } from "@/core/engine/explain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ preview?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolvePublicBrochure(slug);
  if (!resolved) return { title: "Listing not found" };

  const { item, pack } = resolved;
  const title = `${item.name} — ${pack.branding.name}`;
  const description = `${item.subtitle} · ${formatMoney(item.price, item.currency)}`;
  const image = item.photo;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function BrochurePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const wantsPreview = preview === "1";

  let previewTenantId: string | undefined;
  if (wantsPreview) {
    const ctx = await getSessionContext();
    if (ctx && (await serverCan(ctx.tenantId, ctx.role, "brochures.manage"))) {
      previewTenantId = ctx.tenantId;
    }
  }

  const resolved = await resolvePublicBrochure(slug, { previewTenantId });
  if (!resolved) notFound();

  const { item, pack, comparables, assets, brochure } = resolved;
  const isPreview = wantsPreview && brochure.status !== "Published";

  return (
    <BrochureView
      slug={slug}
      item={item}
      pack={{ id: pack.id, label: pack.label, vertical: pack.vertical, currency: pack.currency, branding: pack.branding }}
      comparables={comparables}
      assets={assets}
      template={brochure.template}
      theme={brochure.theme}
      sections={brochure.sections}
      isPreview={isPreview}
    />
  );
}

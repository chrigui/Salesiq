import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolvePublicSharedExperience } from "@/lib/sharedExperiences/resolve";
import { SharedExperienceView } from "@/components/shared-experience/SharedExperienceView";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{ code: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { code } = await params;
  const resolved = await resolvePublicSharedExperience(code);
  if (!resolved) return { title: "Link not found" };
  const { pack } = resolved;
  return {
    title: `Your ${pack.branding.name} experience`,
    description: `${resolved.items.length} listing${resolved.items.length === 1 ? "" : "s"} shared with you.`,
  };
}

export default async function SharedExperiencePage({ params }: { params: Params }) {
  const { code } = await params;
  const resolved = await resolvePublicSharedExperience(code);
  if (!resolved) notFound();

  const { pack, items, focusedItem, sharedExperience } = resolved;

  return (
    <SharedExperienceView
      code={code}
      branding={pack.branding}
      customerName={sharedExperience.customerName}
      items={items}
      focusedItemId={focusedItem?.id ?? null}
      proposalText={sharedExperience.proposalText}
      proposalEngine={sharedExperience.proposalEngine}
    />
  );
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCapability, AuthError } from "@/lib/auth/server";
import { buildBuyerProfileScope } from "@/lib/buyerProfiles/scope";
import { PACKS } from "@/core/industries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface TimelineEntry {
  id: string;
  ts: number;
  kind: "activity" | "relationship" | "requirement-change" | "conversation" | "objection";
  title: string;
  detail?: string;
  meta?: string;
}

function itemName(packId: string | null, itemId: string | null): string {
  if (!packId || !itemId) return "an item";
  return PACKS.find((p) => p.id === packId)?.inventory.find((i) => i.id === itemId)?.name ?? itemId;
}

const RELATIONSHIP_STATE_LABEL: Record<string, string> = {
  viewed: "Viewed",
  saved: "Saved",
  rejected: "Rejected",
  proposal_created: "Proposal created",
};

// Kinds that write a paired BuyerItemRelationship row when the event carries
// a packId+itemId (see ACTIVITY_TO_RELATIONSHIP in the /activity route) —
// that relationship row is the richer, item-specific record of the same real
// action, so the raw activity event is skipped in that case to avoid showing
// the same moment twice. But the pairing only happens when packId+itemId are
// both present (e.g. a proposal covering a whole shortlist has neither), so
// those un-paired events still need their own entry — never skip by kind
// alone.
const ACTIVITY_KIND_LABEL: Record<string, string> = {
  comparison_made: "Compared shortlist",
  property_viewed: "Viewed a property",
  item_saved: "Saved an item",
  proposal_generated: "Proposal generated",
};

const PAIRED_WITH_RELATIONSHIP = new Set(["property_viewed", "item_saved", "proposal_generated"]);

/**
 * Buyer Timeline (Wave 2) — one merged, chronological feed across every
 * category Buyer Intelligence tracks, replacing the separate read-only
 * Requirement History / Activity / Conversation Memory panels. Objections
 * and Rejected Options stay as their own panels since they carry action
 * buttons (Resolve/Override) a flat timeline can't represent well — but
 * objections still appear here too, for the full chronological picture.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireCapability("buyer-intelligence.view");
    const { id } = await params;
    const profile = await prisma.buyerProfile.findFirst({ where: { id, ...buildBuyerProfileScope(ctx) }, select: { id: true } });
    if (!profile) return NextResponse.json({ error: "not-found" }, { status: 404 });

    const [activity, relationships, requirementChanges, notes, objections] = await Promise.all([
      prisma.buyerActivityEvent.findMany({ where: { buyerProfileId: id }, orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.buyerItemRelationship.findMany({ where: { buyerProfileId: id }, orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.buyerRequirementChange.findMany({ where: { buyerProfileId: id }, orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.buyerConversationNote.findMany({ where: { buyerProfileId: id }, orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.buyerObjection.findMany({ where: { buyerProfileId: id }, orderBy: { createdAt: "desc" }, take: 200 }),
    ]);

    const entries: TimelineEntry[] = [];

    for (const a of activity) {
      if (PAIRED_WITH_RELATIONSHIP.has(a.kind) && a.packId && a.itemId) continue; // has a paired relationship row instead
      const label = ACTIVITY_KIND_LABEL[a.kind] ?? a.kind.replace(/_/g, " ");
      entries.push({ id: `activity-${a.id}`, ts: a.createdAt.getTime(), kind: "activity", title: label });
    }

    for (const r of relationships) {
      const label = RELATIONSHIP_STATE_LABEL[r.state] ?? r.state.replace(/_/g, " ");
      const context = r.context as { reason?: string } | null;
      entries.push({
        id: `relationship-${r.id}`,
        ts: r.createdAt.getTime(),
        kind: "relationship",
        title: `${label} · ${itemName(r.packId, r.itemId)}`,
        detail: context?.reason,
      });
    }

    for (const c of requirementChanges) {
      entries.push({
        id: `requirement-change-${c.id}`,
        ts: c.createdAt.getTime(),
        kind: "requirement-change",
        title: `${c.field} updated`,
        detail: `${String(c.previousValue ?? "—")} → ${String(c.newValue ?? "—")}`,
        meta: c.source,
      });
    }

    for (const n of notes) {
      entries.push({
        id: `conversation-${n.id}`,
        ts: n.createdAt.getTime(),
        kind: "conversation",
        title: n.status === "rejected" ? "Conversation captured (rejected)" : "Conversation captured",
        detail: n.rawText,
        meta: n.status,
      });
    }

    for (const o of objections) {
      const evidence = o.evidence as string[] | null;
      entries.push({
        id: `objection-${o.id}`,
        ts: o.createdAt.getTime(),
        kind: "objection",
        title: `Objection: ${o.kind.replace(/-/g, " ")}`,
        detail: evidence?.[0],
        meta: `${o.confidence}${o.resolvedAt ? " · resolved" : ""}`,
      });
    }

    entries.sort((a, b) => b.ts - a.ts);
    return NextResponse.json({ entries });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

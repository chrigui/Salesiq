import type { InventoryItem } from "@/core/types";
import type { CustomerInfo } from "@/core/store/session";
import type { PublicRecapDTO, PublicRecapShortlistItem, PublicRecapComparedProperties } from "@/lib/recaps/resolve";

/**
 * An explicit allowlist seam matching the discipline `DisplayStage.tsx`
 * already enforces by convention (it only ever reads `customer.name`,
 * never `phone`/`email`/`notes`). `InventoryItem` carries no internal-only
 * field today, so `toCustomerSafeItem` is currently a passthrough — but it
 * gives a single, real place to strip a future internal field (an
 * eventual cost basis, a private note) before anything reaches the
 * Display, rather than relying on every new component remembering the
 * rule on its own.
 */
export function toCustomerSafeItem(item: InventoryItem): InventoryItem {
  return item;
}

/** Only `name` is ever safe to show a customer — never phone/email/notes. */
export function toCustomerSafeCustomerName(customer: Pick<CustomerInfo, "name">): string {
  return customer.name;
}

/**
 * The explicit allowlist for the persistent LUMMA Recap public surface
 * (spec section 20 hardening pass) — every field a customer's own /r/[code]
 * page or its child client components are allowed to read. resolvePublicRecap
 * already selects `privateNotes` out of existence at the database layer (it
 * has no field on PublicRecapDTO at all), but `id`/`tenantId`/`buyerProfileId`/
 * `status`/`brandSnapshot`/`lastViewedSnapshot`/timestamps do exist on that
 * DTO for legitimate server-only uses (favorite-lookup, diffing, brand
 * resolution). This is the one deliberate seam that turns "never currently
 * rendered" into "structurally cannot be rendered" — a future field added to
 * PublicRecapDTO is safe by default unless someone also adds it here.
 */
export interface CustomerSafeRecap {
  code: string;
  packId: string;
  pack: PublicRecapDTO["pack"];
  customerName: string;
  customerStory: Record<string, unknown>;
  requirementsSnapshot: Record<string, unknown>;
  shortlistedProperties: PublicRecapShortlistItem[];
  comparedProperties: PublicRecapComparedProperties | null;
  finalRecommendation: PublicRecapShortlistItem | null;
  salespersonMessage: Record<string, unknown> | null;
  nextSteps: string[] | null;
  sectionVisibility: Record<string, string>;
}

export function toCustomerSafeRecap(recap: PublicRecapDTO): CustomerSafeRecap {
  return {
    code: recap.code,
    packId: recap.packId,
    pack: recap.pack,
    customerName: recap.customerName,
    customerStory: recap.customerStory,
    requirementsSnapshot: recap.requirementsSnapshot,
    shortlistedProperties: recap.shortlistedProperties,
    comparedProperties: recap.comparedProperties,
    finalRecommendation: recap.finalRecommendation,
    salespersonMessage: recap.salespersonMessage,
    nextSteps: recap.nextSteps,
    sectionVisibility: recap.sectionVisibility,
  };
}

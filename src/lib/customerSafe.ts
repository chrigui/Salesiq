import type { InventoryItem } from "@/core/types";
import type { CustomerInfo } from "@/core/store/session";

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

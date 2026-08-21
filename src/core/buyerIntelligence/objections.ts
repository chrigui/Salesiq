/**
 * Categorises a raw objection quote into a BuyerObjection.kind — the same
 * keyword categories core/engine/objection.ts already uses to pick a
 * grounded response, reused here rather than reinvented so the persisted
 * record and the live Objection Handler agree on what kind of pushback this
 * was. kind is a plain string column (not a DB enum), so the vocabulary can
 * grow later without a migration.
 */
export function classifyObjectionKind(text: string): string {
  const lower = text.toLowerCase();
  if (/expensive|cost|price|afford|budget/.test(lower)) return "price";
  if (/financ|mortgage|loan|payment plan|down payment/.test(lower)) return "financing";
  if (/think|time|decide|not ready|later/.test(lower)) return "timing";
  if (/compare|other option|look around|shop|elsewhere|competitor/.test(lower)) return "competitor";
  if (/location|area|neighbo(u)?rhood|far|commute/.test(lower)) return "location";
  if (/size|small|big|space|room/.test(lower)) return "size";
  if (/view|floor|orientation/.test(lower)) return "view";
  if (/complet|handover|deadline|ready by/.test(lower)) return "completion-date";
  return "other";
}

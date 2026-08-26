export interface RecapFavoriteEvent {
  kind: "Favorite" | "Unfavorite";
  itemId: string | null;
  createdAt: number;
}

/**
 * Reduces the append-only Favorite/Unfavorite RecapEvent log into the
 * current favorited set — a customer's favorite is a signal, never a
 * mutable column, so it can never silently alter the salesperson's
 * official shortlistedProperties. Sorted by createdAt first so events
 * read back out of insertion order (or a retried write) can't flip the
 * final state; an event with no itemId is dropped rather than favoriting
 * "nothing."
 */
export function deriveFavoriteItemIds(events: RecapFavoriteEvent[]): string[] {
  const favorited = new Set<string>();
  const ordered = [...events].sort((a, b) => a.createdAt - b.createdAt);
  for (const event of ordered) {
    if (!event.itemId) continue;
    if (event.kind === "Favorite") favorited.add(event.itemId);
    else favorited.delete(event.itemId);
  }
  return Array.from(favorited);
}

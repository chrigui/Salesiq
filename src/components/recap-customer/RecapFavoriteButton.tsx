"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";

/**
 * Spec section 23's customer favoriting — a pure engagement signal, posted
 * as a real Favorite/Unfavorite RecapEvent (PR13's public events route),
 * never a mutation of the salesperson's official shortlistedProperties.
 * Optimistic toggle with rollback on a failed request; disabled mid-flight
 * so a rapid double-tap can't race two opposite writes.
 */
export function RecapFavoriteButton({
  code,
  itemId,
  initialFavorited,
}: {
  code: string;
  itemId: string;
  initialFavorited: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !favorited;
    setFavorited(next);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/public/recaps/${code}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: next ? "Favorite" : "Unfavorite", itemId }),
        });
        if (!res.ok) throw new Error("request failed");
      } catch {
        setFavorited(!next);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={favorited}
      aria-label={favorited ? "Remove from your favorites" : "Save to your favorites"}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border backdrop-blur transition ${
        favorited
          ? "border-brand/40 bg-brand/20 text-brand"
          : "border-white/20 bg-black/20 text-white hover:bg-black/30"
      }`}
    >
      <Heart className={`h-4 w-4 ${favorited ? "fill-current" : ""}`} />
    </button>
  );
}

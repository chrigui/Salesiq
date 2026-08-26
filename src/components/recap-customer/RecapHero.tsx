"use client";

import { ItemImage } from "@/components/ui/ItemImage";
import { RECAP_TERM } from "@/lib/recaps/term";
import type { InventoryItem } from "@/core/types";

/**
 * The cinematic opening (spec section 32): "Welcome back, {name}" over a
 * real hero image of the final recommendation (or the top shortlisted
 * item, when no recommendation was set), then a transition line into the
 * story below. No fabricated imagery — falls back to the item's own brand
 * gradient (ItemImage's existing no-photo behavior) when no photo exists.
 */
export function RecapHero({
  customerName,
  heroItem,
  brandName,
  logoGlyph,
}: {
  customerName: string;
  heroItem: InventoryItem | null;
  brandName: string;
  logoGlyph: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.8rem]">
      <ItemImage image={heroItem?.image ?? "default"} photo={heroItem?.photo} className="h-64 w-full sm:h-72">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="absolute inset-x-0 top-0 flex items-center gap-2.5 p-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 text-base backdrop-blur-sm">
            {logoGlyph}
          </div>
          <div className="text-sm font-medium text-white/90">{brandName}</div>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            Welcome back{customerName ? `, ${customerName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-white/80">
            Here&rsquo;s what we discovered together — your {RECAP_TERM}, ready whenever you are.
          </p>
        </div>
      </ItemImage>
    </div>
  );
}

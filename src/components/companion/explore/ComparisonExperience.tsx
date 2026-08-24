"use client";

import { useMemo } from "react";
import { X, ScreenShare } from "lucide-react";
import type { IndustryPack } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";
import { useSession } from "@/core/store/session";
import { whyNotReasons } from "@/core/engine/whyNot";
import { formatMoney } from "@/core/engine/explain";
import { ItemImage } from "@/components/ui/ItemImage";
import { cx } from "@/components/ui/primitives";
import { readPropertyAttributes } from "./attributeDisplay";
import { computeCompareBadges } from "./compareBadges";
import { deriveAvailabilityLabel } from "@/lib/availability";

const BADGE_LABEL: Record<string, string> = {
  bestMatchId: "Best match",
  bestValueId: "Best value",
  bestInvestmentId: "Best investment",
  bestLifestyleId: "Best lifestyle",
};

/**
 * Compares whatever real fields the group's items actually carry — never a
 * fabricated row. Why Not reuses the existing whyNotReasons engine
 * (already generic/pairwise) against whichever item in *this* group scores
 * highest, not necessarily the pack's global top pick.
 */
export function ComparisonExperience({ pack, scored }: { pack: IndustryPack; scored: ScoredItem[] }) {
  const session = useSession();
  const group = useMemo(
    () => session.compareItemIds.map((id) => scored.find((s) => s.item.id === id)).filter((s): s is ScoredItem => Boolean(s)),
    [session.compareItemIds, scored],
  );

  const badges = useMemo(() => computeCompareBadges(pack, session.answers, group), [pack, session.answers, group]);
  const winner = useMemo(
    () => (group.length > 0 ? group.reduce((best, s) => (s.score > best.score ? s : best), group[0]) : null),
    [group],
  );

  const removeItem = (itemId: string) => {
    const remaining = session.compareItemIds.filter((id) => id !== itemId);
    if (remaining.length < 2) {
      session.clearCompare();
    } else {
      session.removeFromCompare(itemId);
    }
  };

  const showToCustomer = () => session.setView("compareGroup");

  if (group.length < 2) return null;

  const badgeFor = (itemId: string): string[] =>
    Object.entries(badges)
      .filter(([, id]) => id === itemId)
      .map(([key]) => BADGE_LABEL[key]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Comparing {group.length} properties</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={showToCustomer}
            className="flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
          >
            <ScreenShare className="h-3.5 w-3.5" />
            Show to customer
          </button>
          <button
            onClick={() => session.clearCompare()}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-white/10"
          >
            Clear
          </button>
        </div>
      </div>

      <div className={cx("grid gap-3", group.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
        {group.map((s) => {
          const attrs = readPropertyAttributes(pack, s.item);
          const availability = deriveAvailabilityLabel(s.item);
          const badgeLabels = badgeFor(s.item.id);
          const isWinner = winner?.item.id === s.item.id;
          const whyNot = !isWinner && winner ? whyNotReasons(pack, session.answers, s, winner) : [];

          return (
            <div key={s.item.id} className="glass-strong flex flex-col rounded-[1.6rem] p-4 ring-1 ring-white/10">
              <div className="mb-2 flex items-start justify-between">
                <ItemImage image={s.item.image} photo={s.item.photo} className="h-24 w-full rounded-xl" />
                <button
                  onClick={() => removeItem(s.item.id)}
                  aria-label="Remove from comparison"
                  className="ml-2 shrink-0 text-ink-faint hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {badgeLabels.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {badgeLabels.map((label) => (
                    <span
                      key={label}
                      className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-sm font-semibold text-ink">{s.item.name}</div>
              <div className="text-xs text-ink-faint">{s.item.location?.label}</div>
              <div className="mt-1 text-base font-semibold text-brand">{formatMoney(s.item.price, s.item.currency)}</div>
              <div className="mt-1 text-xs text-ink-muted">
                {s.score}% match{availability ? ` · ${availability}` : ""}
              </div>

              <dl className="mt-3 space-y-1 text-xs">
                {attrs.bedrooms !== null && (
                  <div className="flex justify-between">
                    <dt className="text-ink-faint">Bedrooms</dt>
                    <dd className="text-ink">{attrs.bedrooms}</dd>
                  </div>
                )}
                {attrs.bathrooms !== null && (
                  <div className="flex justify-between">
                    <dt className="text-ink-faint">Bathrooms</dt>
                    <dd className="text-ink">{attrs.bathrooms}</dd>
                  </div>
                )}
                {(attrs.areaSqm ?? attrs.plotSize) !== null && (
                  <div className="flex justify-between">
                    <dt className="text-ink-faint">Area</dt>
                    <dd className="text-ink">{attrs.areaSqm ?? attrs.plotSize} m²</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-ink-faint">Investment</dt>
                  <dd className="text-ink">
                    {s.item.appreciation !== undefined ? `+${s.item.appreciation}% / 3yr` : "Not available"}
                  </dd>
                </div>
              </dl>

              {s.item.highlights.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {s.item.highlights.slice(0, 3).map((h) => (
                    <span key={h} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-ink-faint ring-1 ring-white/10">
                      {h}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 border-t border-white/5 pt-3">
                {isWinner ? (
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-brand">Why this</div>
                ) : (
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Why not</div>
                )}
                <ul className="mt-1 space-y-1">
                  {(isWinner ? s.reasons.slice(0, 5) : whyNot).map((r, i) => (
                    <li key={i} className="text-xs text-ink-muted">
                      {r}
                    </li>
                  ))}
                  {!isWinner && whyNot.length === 0 && (
                    <li className="text-xs text-ink-faint">Matched fewer priorities than the top pick here.</li>
                  )}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

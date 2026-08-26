import { Sparkles, Trophy } from "lucide-react";
import { formatMoney } from "@/core/engine/explain";
import { RECAP_TERM } from "@/lib/recaps/term";
import type { PublicRecapDTO } from "@/lib/recaps/resolve";

/**
 * PR9 skeleton — proves the resolve+brand plumbing renders real, live data
 * end to end. The full mobile-first cinematic story (hero, journey
 * timeline, progressive-disclosure property details, favorites) is PR10's
 * scope; this only needs to be honest and structurally complete: every
 * section respects sectionVisibility, and nothing here reads anything off
 * PublicRecapDTO beyond what it already exposes (no privateNotes field
 * exists on this type at all).
 */
export function RecapExperienceView({ recap }: { recap: PublicRecapDTO }) {
  const show = (key: string) => (recap.sectionVisibility[key] ?? "show") === "show";

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pb-16 pt-10 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand/20 text-lg text-brand ring-1 ring-brand/30">
          {recap.pack.branding.logoGlyph}
        </div>
        <div>
          <div className="text-sm font-semibold text-ink">{recap.pack.branding.name}</div>
          <div className="text-xs text-ink-faint">{RECAP_TERM}</div>
        </div>
      </div>

      {show("customer") && (
        <h1 className="text-2xl font-semibold text-ink">
          Welcome back{recap.customerName ? `, ${recap.customerName}` : ""}
        </h1>
      )}
      <p className="mt-1 text-sm text-ink-muted">Here&rsquo;s what we discovered together.</p>

      {show("finalRecommendation") && recap.finalRecommendation && (
        <section className="mt-8">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand">
            <Trophy className="h-3.5 w-3.5" />
            Your best match
          </div>
          <div className="glass-strong rounded-[1.8rem] p-5 ring-1 ring-white/10">
            <div className="text-lg font-semibold text-ink">{recap.finalRecommendation.item.name}</div>
            <div className="mt-1 text-sm font-semibold text-brand">
              {formatMoney(recap.finalRecommendation.item.price, recap.finalRecommendation.currency)}
            </div>
            {recap.finalRecommendation.currentAvailability && (
              <div className="mt-1 text-xs text-ink-faint">{recap.finalRecommendation.currentAvailability}</div>
            )}
            <ul className="mt-3 space-y-1">
              {recap.finalRecommendation.reasons.slice(0, 4).map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-ink-muted">
                  <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-brand" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {show("shortlist") && recap.shortlistedProperties.length > 0 && (
        <section className="mt-8">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Your shortlist</div>
          <div className="space-y-3">
            {recap.shortlistedProperties.map((s) => (
              <div
                key={s.item.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3"
              >
                <div>
                  <div className="text-sm font-medium text-ink">{s.item.name}</div>
                  {s.currentAvailability && <div className="text-xs text-ink-faint">{s.currentAvailability}</div>}
                </div>
                <div className="text-sm font-semibold text-brand">{formatMoney(s.item.price, s.currency)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {show("comparison") && recap.comparedProperties && recap.comparedProperties.differences.length > 0 && (
        <section className="mt-8">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">You compared</div>
          <ul className="space-y-1.5">
            {recap.comparedProperties.differences.map((diff, i) => (
              <li key={i} className="text-xs text-ink-muted">
                {diff}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

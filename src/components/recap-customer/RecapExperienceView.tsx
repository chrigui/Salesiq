import { Sparkles } from "lucide-react";
import { buildAnswerSummary } from "@/components/companion/answerSummary";
import { RECAP_TERM } from "@/lib/recaps/term";
import { computeRecapDiff, isUnavailableStatus } from "@/lib/recaps/diff";
import { getRecapFavoriteItemIds, type PublicRecapDTO } from "@/lib/recaps/resolve";
import { toCustomerSafeRecap } from "@/lib/customerSafe";
import { RecapHero } from "./RecapHero";
import { RecapJourneyTimeline, type RecapJourneyStep } from "./RecapJourneyTimeline";
import { SinceYourLastVisit } from "./SinceYourLastVisit";
import { RecapBestMatch } from "./RecapBestMatch";
import { RecapPropertyCard } from "./RecapPropertyCard";
import { NoLongerAvailableAlternatives } from "./NoLongerAvailableAlternatives";
import { RecapComparisonBlock } from "./RecapComparisonBlock";
import { RecapNextSteps } from "./RecapNextSteps";
import type { Answers } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";

/**
 * The full cinematic story (spec sections 6-21, 32-38): welcome → what you
 * told us → your shortlist (why each stood out) → your best match → what's
 * next. Every section is gated by the salesperson's real sectionVisibility
 * choice; the journey timeline only ever links to sections actually
 * rendered. Mobile-first — a single scrolling column, large tap targets,
 * no desktop-grid layout to shrink down.
 *
 * A Server Component deliberately — recap.pack (IndustryPack) carries real
 * scoring-rule `evaluate` functions, which cannot cross the server/client
 * boundary as a prop. Only recap.packId (a plain string) is passed down to
 * the client leaf components that need pack data; they re-resolve the pack
 * themselves via getBasePack(packId), a plain client-importable module —
 * exactly how the Companion/Display already do it (useLivePack), never a
 * serialized pack object.
 *
 * The raw `recap: PublicRecapDTO` prop is only ever touched twice here —
 * `recap.id` (server-only, for the favorites lookup) and
 * `recap.lastViewedSnapshot` (server-only, fed into the pure diff
 * calculation). Every value that actually reaches JSX/child components
 * below goes through `safe = toCustomerSafeRecap(recap)` instead — the
 * hardening pass's explicit allowlist seam (customerSafe.ts) — so a future
 * field added to PublicRecapDTO for some other server-only purpose can
 * never leak here by accident.
 */
export async function RecapExperienceView({ recap }: { recap: PublicRecapDTO }) {
  const favoriteItemIds = new Set(await getRecapFavoriteItemIds(recap.id));
  const recapDiff = computeRecapDiff(recap.lastViewedSnapshot, recap);

  const safe = toCustomerSafeRecap(recap);
  const show = (key: string) => (safe.sectionVisibility[key] ?? "show") === "show";

  const summary = buildAnswerSummary(safe.pack, safe.requirementsSnapshot as Answers);

  // A best-effort ScoredItem[] for the widget-context hook — score/reasons
  // are the real values frozen at creation; breakdown is never read by
  // anything in the property-details widget chain (narrate/comparables
  // only touch item/score/reasons), so an empty array is honest, not faked.
  const scored: ScoredItem[] = safe.shortlistedProperties.map((s) => ({
    item: s.item,
    score: s.score,
    reasons: s.reasons,
    breakdown: [],
  }));

  const otherShortlisted = safe.shortlistedProperties.filter(
    (s) => s.item.id !== safe.finalRecommendation?.item.id,
  );

  const steps: RecapJourneyStep[] = [
    summary.length > 0 && show("requirements") ? { id: "told-us", label: "What you told us" } : null,
    show("shortlist") && safe.shortlistedProperties.length > 0 ? { id: "shortlist", label: "Your shortlist" } : null,
    show("finalRecommendation") && safe.finalRecommendation ? { id: "best-match", label: "Best match" } : null,
    show("comparison") && safe.comparedProperties ? { id: "compared", label: "You compared" } : null,
    show("notes") ? { id: "next-steps", label: "Next steps" } : null,
  ].filter((s): s is RecapJourneyStep => Boolean(s));

  const heroItem = safe.finalRecommendation?.item ?? safe.shortlistedProperties[0]?.item ?? null;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6">
      {show("customer") && (
        <RecapHero
          customerName={safe.customerName}
          heroItem={heroItem}
          brandName={safe.pack.branding.name}
          logoGlyph={safe.pack.branding.logoGlyph}
        />
      )}

      <div className="mt-4 space-y-4">
        <RecapJourneyTimeline steps={steps} />
        <SinceYourLastVisit diff={recapDiff} />
      </div>

      {summary.length > 0 && show("requirements") && (
        <section id="told-us" className="mt-8 scroll-mt-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">What you told us</div>
          <div className="space-y-3">
            {summary.map((section) => (
              <div key={section.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                  {section.label}
                </div>
                <ul className="space-y-1">
                  {section.entries.map((e) => (
                    <li key={e.questionId} className="flex items-start gap-2 text-xs text-ink-muted">
                      <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-brand" />
                      <span>
                        <span className="text-ink-faint">{e.label}:</span> {e.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {show("finalRecommendation") && safe.finalRecommendation && (
        <section id="best-match" className="mt-8 scroll-mt-6">
          {isUnavailableStatus(safe.finalRecommendation.currentAvailability) ? (
            <NoLongerAvailableAlternatives
              pack={safe.pack}
              item={safe.finalRecommendation.item}
              currentAvailability={safe.finalRecommendation.currentAvailability}
            />
          ) : (
            <RecapBestMatch
              entry={safe.finalRecommendation}
              packId={safe.packId}
              scored={scored}
              showPayment={show("payment")}
              showInvestment={show("investment")}
              code={safe.code}
              favorited={favoriteItemIds.has(safe.finalRecommendation.item.id)}
            />
          )}
        </section>
      )}

      {show("shortlist") && otherShortlisted.length > 0 && (
        <section id="shortlist" className="mt-8 scroll-mt-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {safe.finalRecommendation ? "Also on your shortlist" : "Your shortlist"}
          </div>
          <div className="space-y-4">
            {otherShortlisted.map((entry) =>
              isUnavailableStatus(entry.currentAvailability) ? (
                <NoLongerAvailableAlternatives
                  key={entry.item.id}
                  pack={safe.pack}
                  item={entry.item}
                  currentAvailability={entry.currentAvailability}
                />
              ) : (
                <RecapPropertyCard
                  key={entry.item.id}
                  entry={entry}
                  packId={safe.packId}
                  scored={scored}
                  showPayment={show("payment")}
                  showInvestment={show("investment")}
                  code={safe.code}
                  favorited={favoriteItemIds.has(entry.item.id)}
                />
              ),
            )}
          </div>
        </section>
      )}

      {show("comparison") && safe.comparedProperties && safe.comparedProperties.items.length > 0 && (
        <section id="compared" className="mt-8 scroll-mt-6">
          <RecapComparisonBlock compared={safe.comparedProperties} />
        </section>
      )}

      {show("notes") && (
        <section id="next-steps" className="mt-8 scroll-mt-6">
          <RecapNextSteps
            message={typeof safe.salespersonMessage?.text === "string" ? safe.salespersonMessage.text : null}
            advisorPhone={
              typeof safe.salespersonMessage?.advisorPhone === "string" ? safe.salespersonMessage.advisorPhone : null
            }
          />
        </section>
      )}

      <p className="mt-10 text-center text-[11px] text-ink-faint">{RECAP_TERM} · {safe.pack.branding.name}</p>
    </div>
  );
}

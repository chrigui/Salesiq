import { Sparkles } from "lucide-react";
import { buildAnswerSummary } from "@/components/companion/answerSummary";
import { RECAP_TERM } from "@/lib/recaps/term";
import { computeRecapDiff, isUnavailableStatus } from "@/lib/recaps/diff";
import { getRecapFavoriteItemIds, type PublicRecapDTO } from "@/lib/recaps/resolve";
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
 */
export async function RecapExperienceView({ recap }: { recap: PublicRecapDTO }) {
  const show = (key: string) => (recap.sectionVisibility[key] ?? "show") === "show";

  const favoriteItemIds = new Set(await getRecapFavoriteItemIds(recap.id));

  const summary = buildAnswerSummary(recap.pack, recap.requirementsSnapshot as Answers);

  // A best-effort ScoredItem[] for the widget-context hook — score/reasons
  // are the real values frozen at creation; breakdown is never read by
  // anything in the property-details widget chain (narrate/comparables
  // only touch item/score/reasons), so an empty array is honest, not faked.
  const scored: ScoredItem[] = recap.shortlistedProperties.map((s) => ({
    item: s.item,
    score: s.score,
    reasons: s.reasons,
    breakdown: [],
  }));

  const otherShortlisted = recap.shortlistedProperties.filter(
    (s) => s.item.id !== recap.finalRecommendation?.item.id,
  );

  const recapDiff = computeRecapDiff(recap.lastViewedSnapshot, recap);

  const steps: RecapJourneyStep[] = [
    summary.length > 0 && show("requirements") ? { id: "told-us", label: "What you told us" } : null,
    show("shortlist") && recap.shortlistedProperties.length > 0 ? { id: "shortlist", label: "Your shortlist" } : null,
    show("finalRecommendation") && recap.finalRecommendation ? { id: "best-match", label: "Best match" } : null,
    show("comparison") && recap.comparedProperties ? { id: "compared", label: "You compared" } : null,
    show("notes") ? { id: "next-steps", label: "Next steps" } : null,
  ].filter((s): s is RecapJourneyStep => Boolean(s));

  const heroItem = recap.finalRecommendation?.item ?? recap.shortlistedProperties[0]?.item ?? null;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6">
      {show("customer") && (
        <RecapHero
          customerName={recap.customerName}
          heroItem={heroItem}
          brandName={recap.pack.branding.name}
          logoGlyph={recap.pack.branding.logoGlyph}
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

      {show("finalRecommendation") && recap.finalRecommendation && (
        <section id="best-match" className="mt-8 scroll-mt-6">
          {isUnavailableStatus(recap.finalRecommendation.currentAvailability) ? (
            <NoLongerAvailableAlternatives
              pack={recap.pack}
              item={recap.finalRecommendation.item}
              currentAvailability={recap.finalRecommendation.currentAvailability}
            />
          ) : (
            <RecapBestMatch
              entry={recap.finalRecommendation}
              packId={recap.packId}
              scored={scored}
              showPayment={show("payment")}
              showInvestment={show("investment")}
              code={recap.code}
              favorited={favoriteItemIds.has(recap.finalRecommendation.item.id)}
            />
          )}
        </section>
      )}

      {show("shortlist") && otherShortlisted.length > 0 && (
        <section id="shortlist" className="mt-8 scroll-mt-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {recap.finalRecommendation ? "Also on your shortlist" : "Your shortlist"}
          </div>
          <div className="space-y-4">
            {otherShortlisted.map((entry) =>
              isUnavailableStatus(entry.currentAvailability) ? (
                <NoLongerAvailableAlternatives
                  key={entry.item.id}
                  pack={recap.pack}
                  item={entry.item}
                  currentAvailability={entry.currentAvailability}
                />
              ) : (
                <RecapPropertyCard
                  key={entry.item.id}
                  entry={entry}
                  packId={recap.packId}
                  scored={scored}
                  showPayment={show("payment")}
                  showInvestment={show("investment")}
                  code={recap.code}
                  favorited={favoriteItemIds.has(entry.item.id)}
                />
              ),
            )}
          </div>
        </section>
      )}

      {show("comparison") && recap.comparedProperties && recap.comparedProperties.items.length > 0 && (
        <section id="compared" className="mt-8 scroll-mt-6">
          <RecapComparisonBlock compared={recap.comparedProperties} />
        </section>
      )}

      {show("notes") && (
        <section id="next-steps" className="mt-8 scroll-mt-6">
          <RecapNextSteps
            message={typeof recap.salespersonMessage?.text === "string" ? recap.salespersonMessage.text : null}
            advisorPhone={
              typeof recap.salespersonMessage?.advisorPhone === "string" ? recap.salespersonMessage.advisorPhone : null
            }
          />
        </section>
      )}

      <p className="mt-10 text-center text-[11px] text-ink-faint">{RECAP_TERM} · {recap.pack.branding.name}</p>
    </div>
  );
}

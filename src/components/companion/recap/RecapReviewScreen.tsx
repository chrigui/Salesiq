"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ClipboardCheck, Loader2, Sparkles, Smartphone, Copy, Check } from "lucide-react";
import { useSession } from "@/core/store/session";
import { buildAnswerSummary } from "@/components/companion/answerSummary";
import { formatMoney } from "@/core/engine/explain";
import { useContinueQrDataUrl } from "@/components/display/ContinueQr";
import { createRecap, type RecapSalespersonMessageInput } from "@/core/store/recaps";
import { RECAP_SECTIONS, defaultRecapSectionVisibility, type RecapSectionVisibility } from "@/core/data/recapSections";
import { SectionVisibilityToggle } from "./SectionVisibilityToggle";
import { SalespersonStoryEditor } from "./SalespersonStoryEditor";
import { RecapShareSheet } from "./RecapShareSheet";
import { RECAP_TERM } from "@/lib/recaps/term";
import type { ScoredItem } from "@/core/engine/scoring";
import type { IndustryPack } from "@/core/types";

type ReviewStep = "review" | "story" | "created";

/**
 * The salesperson-facing wizard that turns the live meeting into a
 * persistent LUMMA Recap (spec sections 2-3, 12-13). Reads session state
 * directly — the shortlist (recapItemIds), comparison group, answers and
 * customer info are never duplicated here, only summarized for review.
 * "review" -> "story" -> POST /api/recaps -> "created" (code + QR).
 */
export function RecapReviewScreen({
  pack,
  scored,
  onBack,
}: {
  pack: IndustryPack;
  scored: ScoredItem[];
  onBack: () => void;
}) {
  const session = useSession();
  const [step, setStep] = useState<ReviewStep>("review");
  const [sectionVisibility, setSectionVisibility] = useState<RecapSectionVisibility>(defaultRecapSectionVisibility());
  const [privateNotes, setPrivateNotes] = useState("");
  const [message, setMessage] = useState<RecapSalespersonMessageInput>({
    templateKind: "ThankYou",
    text: "",
    advisorPhone: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const shortlisted = useMemo(
    () => scored.filter((s) => session.recapItemIds.includes(s.item.id)),
    [scored, session.recapItemIds],
  );
  const finalRecommendation = useMemo(
    () => (shortlisted.length > 0 ? [...shortlisted].sort((a, b) => b.score - a.score)[0] : null),
    [shortlisted],
  );
  const summary = useMemo(() => buildAnswerSummary(pack, session.answers), [pack, session.answers]);
  const customerFirstName = session.customer.name.trim().split(/\s+/)[0] ?? "";

  const recapUrl = code ? `${window.location.origin}/r/${code}` : null;
  const qr = useContinueQrDataUrl(recapUrl);

  const handleCreate = async () => {
    if (creating || shortlisted.length === 0) return;
    setCreating(true);
    setCreateError(null);
    try {
      const result = await createRecap({
        packId: pack.id,
        answers: session.answers,
        shortlistItemIds: shortlisted.map((s) => s.item.id),
        compareItemIds: session.compareItemIds.length >= 2 ? session.compareItemIds : undefined,
        finalRecommendationItemId: finalRecommendation?.item.id ?? null,
        customerName: session.customer.name || null,
        buyerProfileId: session.buyerProfileId,
        salespersonMessage: message.text ? message : null,
        sectionVisibility,
        privateNotes: privateNotes || null,
      });
      if (!result) {
        setCreateError(`Couldn't create the ${RECAP_TERM} — try again.`);
        return;
      }
      setCode(result.code);
      setStep("created");
    } catch {
      setCreateError("Couldn't reach the server — check your connection.");
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async () => {
    if (!recapUrl) return;
    try {
      await navigator.clipboard.writeText(recapUrl);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — the link is still visible to copy by hand.
    }
  };

  if (step === "created") {
    return (
      <div className="bg-aurora flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <div className="glass-strong w-full max-w-sm rounded-[1.8rem] p-6 ring-1 ring-white/10">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand/20 text-brand ring-1 ring-brand/30">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold text-ink">Your {RECAP_TERM} is ready</h1>
          <p className="mt-1 text-xs text-ink-faint">
            {session.customer.name ? `${session.customer.name} can` : "The customer can"} revisit everything we
            covered, anytime, from any device.
          </p>

          <div className="mx-auto mt-5 w-fit rounded-2xl bg-white p-3">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="LUMMA Recap QR code" width={200} height={200} />
            ) : (
              <div className="h-[200px] w-[200px] animate-pulse rounded-lg bg-zinc-200" />
            )}
          </div>

          <div className="mt-3 text-[11px] uppercase tracking-[0.2em] text-ink-faint">Code {code}</div>

          {recapUrl && (
            <div className="mt-4 flex items-center gap-2">
              <a
                href={recapUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-xs font-semibold text-white transition hover:brightness-110"
              >
                <Smartphone className="h-3.5 w-3.5" />
                Open on phone
              </a>
              <button
                onClick={() => void copyLink()}
                className="flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-ink-muted transition hover:bg-white/10"
              >
                {linkCopied ? <Check className="h-3.5 w-3.5 text-brand" /> : <Copy className="h-3.5 w-3.5" />}
                {linkCopied ? "Copied" : "Copy link"}
              </button>
            </div>
          )}

          {recapUrl && (
            <div className="mt-5 border-t border-white/5 pt-4">
              <RecapShareSheet
                recapUrl={recapUrl}
                customerName={session.customer.name}
                customerPhone={session.customer.phone}
                customerEmail={session.customer.email}
                brandName={pack.branding.name}
              />
            </div>
          )}
        </div>

        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Decision Room
        </button>
      </div>
    );
  }

  return (
    <div className="bg-aurora min-h-screen px-4 pb-10 pt-6 sm:px-6">
      <div className="mx-auto max-w-lg">
        <button
          onClick={() => (step === "story" ? setStep("review") : onBack())}
          className="mb-3 flex items-center gap-1 text-sm font-medium text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          {step === "story" ? "Back to review" : "Back"}
        </button>

        {step === "review" && (
          <>
            <div className="glass-strong rounded-[1.8rem] p-5 ring-1 ring-white/10">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand">Meeting recap</div>
              <h1 className="text-lg font-semibold text-ink">
                {session.customer.name || "Your customer"}
              </h1>

              {summary.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">What matters</div>
                  <ul className="space-y-1">
                    {summary
                      .flatMap((s) => s.entries)
                      .slice(0, 6)
                      .map((e) => (
                        <li key={e.questionId} className="flex items-start gap-2 text-xs text-ink-muted">
                          <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-brand" />
                          <span>
                            <span className="text-ink-faint">{e.label}:</span> {e.value}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              <div className="mt-3 border-t border-white/5 pt-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                  Shortlist ({shortlisted.length})
                </div>
                <ul className="mt-1 space-y-1">
                  {shortlisted.map((s) => (
                    <li key={s.item.id} className="flex items-center justify-between text-xs text-ink-muted">
                      <span>{s.item.name}</span>
                      <span className="text-ink-faint">{formatMoney(s.item.price, s.item.currency)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {finalRecommendation && (
                <div className="mt-3 border-t border-white/5 pt-3">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                    Final recommendation
                  </div>
                  <div className="mt-1 text-sm font-medium text-ink">{finalRecommendation.item.name}</div>
                </div>
              )}
            </div>

            <div className="mt-5">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                What the customer sees
              </div>
              <div className="space-y-1.5">
                {RECAP_SECTIONS.map((section) => (
                  <div
                    key={section.key}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-2"
                  >
                    <span className="text-sm text-ink-muted">{section.label}</span>
                    <SectionVisibilityToggle
                      value={sectionVisibility[section.key] ?? "show"}
                      onChange={(value) =>
                        setSectionVisibility((prev) => ({ ...prev, [section.key]: value }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Private notes
              </div>
              <p className="mb-2 text-[11px] text-ink-faint">Never shown to the customer, on any surface.</p>
              <textarea
                value={privateNotes}
                onChange={(e) => setPrivateNotes(e.target.value)}
                rows={3}
                placeholder="Internal notes for your own follow-up…"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint/50 focus:border-brand/50"
              />
            </div>

            <button
              onClick={() => setStep("story")}
              disabled={shortlisted.length === 0}
              className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-full bg-brand py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
            </button>
          </>
        )}

        {step === "story" && (
          <>
            <h1 className="mb-4 text-lg font-semibold text-ink">Your story to {session.customer.name || "them"}</h1>
            <SalespersonStoryEditor
              buyerProfileId={session.buyerProfileId}
              customerFirstName={customerFirstName}
              value={message}
              onChange={setMessage}
            />

            {createError && <p className="mt-3 text-center text-xs text-rose-400">{createError}</p>}

            <button
              onClick={() => void handleCreate()}
              disabled={creating}
              className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-full bg-brand py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                `Create ${RECAP_TERM}`
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, FileText, Check, Mail, MessageCircle, Printer, Sparkles, Loader2 } from "lucide-react";
import { useSession } from "@/core/store/session";
import { narrate, formatMoney } from "@/core/engine/explain";
import { saveLead } from "@/core/store/leads";
import { getKnowledgeBase, knowledgePayload } from "@/core/data/knowledgeBase";
import { getAiSettings } from "@/core/data/aiSettings";
import type { IndustryPack } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";

/**
 * A plain-text summary of the proposal, shared by the Email and WhatsApp
 * links. When an AI-authored proposal has been generated it's already a
 * complete letter (greeting through call-to-action), so it's used verbatim
 * instead of being wrapped a second time.
 */
function proposalMessage(
  pack: IndustryPack,
  customerName: string,
  best: ScoredItem | undefined,
  aiProposal?: string | null,
): string {
  if (aiProposal) return aiProposal;
  if (!best) return `Your ${pack.branding.name} proposal.`;
  const lines = [
    `Hi ${customerName || "there"},`,
    ``,
    `Here's the ${pack.branding.name} proposal we put together for you:`,
    ``,
    `${best.item.name} — ${formatMoney(best.item.price, best.item.currency)}`,
    narrate(best, pack),
    ``,
    ...best.item.highlights.map((h) => `• ${h}`),
  ];
  return lines.join("\n");
}

/** Digits-only phone for a wa.me deep link (WhatsApp ignores +/spaces anyway). */
function toWhatsAppDigits(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

/**
 * Generates a client-ready proposal from the live session — the "Generate
 * proposal" action from the spec. Everything is derived from the answers and
 * the AI Decision Engine's reasons, so it is always consistent with what the
 * customer saw on screen.
 */
export function ProposalSheet({
  open,
  onClose,
  pack,
  scored,
}: {
  open: boolean;
  onClose: () => void;
  pack: IndustryPack;
  scored: ScoredItem[];
}) {
  const { customer, answers, logEvent } = useSession();
  const best = scored[0];
  const [saved, setSaved] = useState(false);
  const [aiProposal, setAiProposal] = useState<string | null>(null);
  const [aiEngine, setAiEngine] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Reset the saved state whenever the sheet is reopened, and record it on
  // the session timeline — this is the "Generate proposal" interaction.
  useEffect(() => {
    if (open) {
      setSaved(false);
      setAiProposal(null);
      setAiEngine(null);
      if (best) {
        logEvent({
          kind: "proposal",
          detail: `Generated proposal for ${best.item.name}`,
        });
      }
    }
    // logEvent is stable (Zustand store action); only re-run on open/best change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Proposal Writer (Module 6): upgrades the deterministic one-liner into a
  // full, multi-paragraph letter grounded in the same verified facts plus the
  // tenant's Knowledge Base. Claude-authored when a key is set, deterministic
  // otherwise — either way the UI shown here is identical.
  const generateAiProposal = async () => {
    if (!best || generating) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId: pack.id,
          answers,
          customerName: customer.name,
          knowledge: knowledgePayload(getKnowledgeBase()),
          settings: getAiSettings(),
        }),
      });
      const data = await res.json();
      if (data?.proposal) {
        setAiProposal(data.proposal);
        setAiEngine(data.engine ?? null);
        logEvent({ kind: "proposal", detail: `Wrote AI proposal for ${best.item.name}` });
      }
    } catch {
      // Network/route failure — the deterministic one-liner already on screen
      // still stands, so there's nothing more to do here.
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveLead = () => {
    if (!best) return;
    saveLead({
      name: customer.name || "Unnamed lead",
      phone: customer.phone,
      email: customer.email,
      notes: customer.notes,
      packId: pack.id,
      packLabel: pack.label,
      itemName: best.item.name,
      price: best.item.price,
      currency: best.item.currency,
      score: best.score,
    });
    logEvent({ kind: "lead", detail: `Saved lead — ${customer.name || "Unnamed"}` });
    setSaved(true);
  };

  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const message = proposalMessage(pack, customer.name, best, aiProposal);
  const mailtoUrl = customer.email
    ? `mailto:${encodeURIComponent(customer.email)}?subject=${encodeURIComponent(
        `Your ${pack.branding.name} proposal`,
      )}&body=${encodeURIComponent(message)}`
    : null;
  const whatsappDigits = customer.phone ? toWhatsAppDigits(customer.phone) : "";
  const whatsappUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(message)}`
    : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-strong max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl p-6 sm:rounded-3xl"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand" />
                <h3 className="text-lg font-semibold">Proposal</h3>
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-ink-muted hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <div className="text-base font-semibold">
                    {pack.branding.name}
                  </div>
                  <div className="text-xs text-ink-faint">{date}</div>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand/20 text-brand">
                  {pack.branding.logoGlyph}
                </div>
              </div>

              <div className="py-3">
                <div className="text-[11px] uppercase tracking-wide text-ink-faint">
                  Prepared for
                </div>
                <div className="text-sm font-medium">
                  {customer.name || "—"}
                </div>
                {customer.email && (
                  <div className="text-xs text-ink-faint">{customer.email}</div>
                )}
              </div>

              {best && (
                <div className="border-t border-white/5 pt-3">
                  <div className="text-[11px] uppercase tracking-wide text-ink-faint">
                    Recommended
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-lg font-semibold">
                      {best.item.name}
                    </span>
                    <span className="text-lg font-semibold text-brand">
                      {formatMoney(best.item.price, best.item.currency)}
                    </span>
                  </div>
                  {aiProposal ? (
                    <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink-muted">
                      {aiProposal.split(/\n\n+/).map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                      {narrate(best, pack)}
                    </p>
                  )}
                  <button
                    onClick={generateAiProposal}
                    disabled={generating}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand transition hover:brightness-110 disabled:opacity-50"
                  >
                    {generating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {generating
                      ? "Writing…"
                      : aiProposal
                        ? "Rewrite with AI"
                        : "Write full proposal with AI"}
                  </button>
                  {aiEngine && (
                    <p className="mt-1 text-[10px] text-ink-faint">
                      {aiEngine === "claude+writer"
                        ? "Authored by Claude from verified facts."
                        : "Deterministic writer — set ANTHROPIC_API_KEY for Claude-authored prose."}
                    </p>
                  )}
                  <div className="mt-3 space-y-1.5">
                    {best.item.highlights.map((h) => (
                      <div
                        key={h}
                        className="flex items-center gap-2 text-xs text-ink-muted"
                      >
                        <Check className="h-3.5 w-3.5 text-brand" /> {h}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 border-t border-white/5 pt-3">
                <div className="text-[11px] uppercase tracking-wide text-ink-faint">
                  Alternatives considered
                </div>
                {scored.slice(1, 3).map((s) => (
                  <div
                    key={s.item.id}
                    className="mt-1.5 flex items-center justify-between text-sm"
                  >
                    <span className="text-ink-muted">{s.item.name}</span>
                    <span className="text-ink-faint">
                      {formatMoney(s.item.price, s.item.currency)} · {s.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveLead}
              disabled={saved || !best}
              className="mt-4 w-full rounded-2xl bg-brand py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {saved ? (
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4" /> Saved to CRM
                </span>
              ) : (
                "Save lead to CRM"
              )}
            </button>

            <div className="mt-2 grid grid-cols-4 gap-1.5">
              <DeliveryButton
                icon={Mail}
                label="Email"
                href={mailtoUrl}
                onSend={() =>
                  logEvent({ kind: "proposal", detail: `Emailed proposal to ${customer.email}` })
                }
                disabledHint="Add an email above first"
              />
              <DeliveryButton
                icon={MessageCircle}
                label="WhatsApp"
                href={whatsappUrl}
                onSend={() =>
                  logEvent({ kind: "proposal", detail: `Sent proposal via WhatsApp` })
                }
                disabledHint="Add a phone number above first"
              />
              <button
                onClick={() => window.print()}
                className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-ink-muted transition hover:bg-white/5 hover:text-ink"
              >
                <Printer className="h-5 w-5" />
                <span className="text-[10px] font-medium">PDF / Print</span>
              </button>
              <button
                onClick={onClose}
                className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-ink-muted transition hover:bg-white/5 hover:text-ink"
              >
                <X className="h-5 w-5" />
                <span className="text-[10px] font-medium">Close</span>
              </button>
            </div>
            <p className="mt-3 text-center text-[11px] text-ink-faint">
              Generated from {Object.keys(answers).length} answers · reasons
              verified by the decision engine
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * A real (not simulated) send: `mailto:`/`wa.me` links hand off to the
 * customer's own mail client or WhatsApp with the proposal pre-filled — no
 * backend required. Greyed out with an explanatory title when the contact
 * field it needs hasn't been captured yet.
 */
function DeliveryButton({
  icon: Icon,
  label,
  href,
  onSend,
  disabledHint,
}: {
  icon: typeof Mail;
  label: string;
  href: string | null;
  onSend: () => void;
  disabledHint: string;
}) {
  if (!href) {
    return (
      <button
        disabled
        title={disabledHint}
        className="flex cursor-not-allowed flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-ink-faint/50"
      >
        <Icon className="h-5 w-5" />
        <span className="text-[10px] font-medium">{label}</span>
      </button>
    );
  }
  return (
    <a
      href={href}
      target={href.startsWith("https://") ? "_blank" : undefined}
      rel={href.startsWith("https://") ? "noreferrer" : undefined}
      onClick={onSend}
      className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-ink-muted transition hover:bg-white/5 hover:text-ink"
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </a>
  );
}

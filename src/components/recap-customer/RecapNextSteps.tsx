"use client";

import { MessageCircle, Phone, ListChecks } from "lucide-react";
import { trackRecapEvent } from "./trackRecapEvent";

/** Digits-only phone for a wa.me deep link — same convention as ProposalSheet.tsx's toWhatsAppDigits. */
function toWhatsAppDigits(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

/**
 * Spec section 21/38's "WHAT'S NEXT?" — only actions this app genuinely
 * supports: a real tel:/wa.me deep-link to the advisor phone the
 * salesperson entered at creation (never invented), the salesperson's own
 * thank-you message verbatim, and a jump back to the shortlist. No fake
 * booking/calendar affordance — nothing here that isn't real. Each real tap
 * fires a genuine ContactClick RecapEvent (PR13's public events route) —
 * the only two actions on this page a salesperson would recognize as "the
 * customer reached out."
 */
export function RecapNextSteps({
  code,
  message,
  advisorPhone,
}: {
  code: string;
  message: string | null;
  advisorPhone: string | null;
}) {
  const digits = advisorPhone ? toWhatsAppDigits(advisorPhone) : "";
  const telHref = advisorPhone ? `tel:${advisorPhone}` : null;
  const waHref = digits ? `https://wa.me/${digits}` : null;

  return (
    <div className="glass-strong rounded-[1.8rem] p-5 ring-1 ring-white/10">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand">
        <ListChecks className="h-3.5 w-3.5" />
        What&rsquo;s next
      </div>

      {message && (
        <p className="mb-4 whitespace-pre-line text-sm leading-relaxed text-ink-muted">{message}</p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {telHref && (
          <a
            href={telHref}
            onClick={() => trackRecapEvent(code, "ContactClick", undefined, { method: "call" })}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <Phone className="h-4 w-4" />
            Call your advisor
          </a>
        )}
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackRecapEvent(code, "ContactClick", undefined, { method: "whatsapp" })}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-3 text-sm font-medium text-ink-muted transition hover:bg-white/10"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        )}
        {!telHref && !waHref && (
          <a
            href="#shortlist"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-3 text-sm font-medium text-ink-muted transition hover:bg-white/10"
          >
            Revisit your shortlist
          </a>
        )}
      </div>
    </div>
  );
}

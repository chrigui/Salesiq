"use client";

import { useState } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { toWhatsAppDigits } from "@/components/companion/ProposalSheet";
import { RECAP_TERM } from "@/lib/recaps/term";

function defaultShareMessage(customerName: string, brandName: string, recapUrl: string): string {
  const greeting = customerName ? `Hi ${customerName},` : "Hi,";
  return [
    greeting,
    "",
    `Here's your ${RECAP_TERM} from ${brandName} — everything we covered, ready whenever you want to revisit it, compare properties, or explore something new:`,
    "",
    recapUrl,
  ].join("\n");
}

/**
 * Real (not simulated) WhatsApp/Email sends for the just-created Recap —
 * mailto:/wa.me deep-links, same convention ProposalSheet.tsx already
 * established for proposal sharing (no backend messaging vendor exists or
 * is being added). toWhatsAppDigits is reused verbatim from there. The
 * message is editable before sending but always carries the real /r/[code]
 * URL and never an internal id.
 */
export function RecapShareSheet({
  recapUrl,
  customerName,
  customerPhone,
  customerEmail,
  brandName,
}: {
  recapUrl: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  brandName: string;
}) {
  const [message, setMessage] = useState(() => defaultShareMessage(customerName, brandName, recapUrl));

  const whatsappDigits = customerPhone ? toWhatsAppDigits(customerPhone) : "";
  const whatsappUrl = whatsappDigits ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(message)}` : null;
  const mailtoUrl = customerEmail
    ? `mailto:${encodeURIComponent(customerEmail)}?subject=${encodeURIComponent(`Your ${RECAP_TERM}`)}&body=${encodeURIComponent(message)}`
    : null;

  return (
    <div className="w-full text-left">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Share the {RECAP_TERM}</div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-ink outline-none focus:border-brand/50"
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        {mailtoUrl ? (
          <a
            href={mailtoUrl}
            className="flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-ink-muted transition hover:bg-white/10"
          >
            <Mail className="h-3.5 w-3.5" /> Email
          </a>
        ) : (
          <button
            disabled
            title="Add the customer's email above first"
            className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-full border border-white/5 py-2.5 text-xs font-medium text-ink-faint/50"
          >
            <Mail className="h-3.5 w-3.5" /> Email
          </button>
        )}
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-ink-muted transition hover:bg-white/10"
          >
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </a>
        ) : (
          <button
            disabled
            title="Add the customer's phone number above first"
            className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-full border border-white/5 py-2.5 text-xs font-medium text-ink-faint/50"
          >
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </button>
        )}
      </div>
    </div>
  );
}

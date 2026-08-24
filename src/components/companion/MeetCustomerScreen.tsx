"use client";

import { useState } from "react";
import { Eye, EyeOff, User2 } from "lucide-react";
import { useSession } from "@/core/store/session";
import { maskName, maskPhone, maskEmail } from "@/lib/privacy";
import { useMeetingFlow } from "./meetingFlow";

/**
 * The customer may be standing right next to the salesperson in a public
 * showroom or trade show — this screen confirms who they're meeting without
 * broadcasting the customer's own contact details to anyone glancing at the
 * phone. Revealing is a deliberate, explicit action, never the default.
 */
export function MeetCustomerScreen() {
  const { customer } = useSession();
  const flow = useMeetingFlow();
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="bg-aurora flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="glass-strong w-full max-w-sm rounded-[2.2rem] p-8 text-center ring-1 ring-white/10">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand/15 text-brand">
          <User2 className="h-7 w-7" />
        </div>

        <div className="mt-5 text-2xl font-semibold text-ink">
          {revealed ? customer.name : maskName(customer.name)}
        </div>

        <div className="mt-3 space-y-1 text-sm text-ink-muted">
          {customer.phone && <div>{revealed ? customer.phone : maskPhone(customer.phone)}</div>}
          {customer.email && <div>{revealed ? customer.email : maskEmail(customer.email)}</div>}
          {!customer.phone && !customer.email && (
            <div className="text-ink-faint">No contact details captured</div>
          )}
        </div>

        {(customer.phone || customer.email) && (
          <button
            onClick={() => setRevealed((r) => !r)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-white/10"
          >
            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {revealed ? "Hide details" : "Reveal details"}
          </button>
        )}

        <p className="mt-8 text-sm text-ink-muted">Let&apos;s get to know what matters to them.</p>

        <button
          onClick={() => flow.goTo("discover")}
          className="mt-3 w-full rounded-2xl bg-brand py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Start Discovery
        </button>

        <button
          onClick={() => flow.goTo("workspace")}
          className="mt-4 w-full text-center text-xs text-ink-faint underline-offset-2 hover:underline"
        >
          Skip setup
        </button>
      </div>
    </div>
  );
}

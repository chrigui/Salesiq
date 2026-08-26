"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { User, Phone, Mail } from "lucide-react";
import { useBuyerProfile } from "@/core/store/buyerProfiles";
import { RECAP_MESSAGE_TEMPLATES } from "@/core/data/recapMessageTemplates";
import type { RecapSalespersonMessageInput } from "@/core/store/recaps";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * Spec section 12 — the "Your advisor" block + a thank-you message chosen
 * from a template and editable before creation. Advisor name comes from the
 * real assigned-salesperson field on the linked BuyerProfile, falling back
 * to the logged-in user's own session (no shared Companion hook wraps
 * /api/auth/session yet, so this reads it directly). No advisor photo: no
 * avatar/photo field exists anywhere on User, so none is shown or invented.
 */
export function SalespersonStoryEditor({
  buyerProfileId,
  customerFirstName,
  value,
  onChange,
}: {
  buyerProfileId: string | null;
  customerFirstName: string;
  value: RecapSalespersonMessageInput;
  onChange: (value: RecapSalespersonMessageInput) => void;
}) {
  const { buyerProfile } = useBuyerProfile(buyerProfileId);
  const { data: sessionData } = useSWR<{ session: { name: string; email: string } | null }>(
    "/api/auth/session",
    fetcher,
  );
  const advisorName = buyerProfile?.assignedToName || sessionData?.session?.name || "Your advisor";
  const advisorEmail = sessionData?.session?.email ?? null;

  const [editedManually, setEditedManually] = useState(false);

  const applyTemplate = (kind: RecapSalespersonMessageInput["templateKind"]) => {
    const template = RECAP_MESSAGE_TEMPLATES.find((t) => t.kind === kind);
    const text = template ? template.buildText({ customerFirstName, advisorName }) : value.text;
    onChange({ ...value, templateKind: kind, text });
    setEditedManually(false);
  };

  // Fills the default template once the real advisor name resolves, but only
  // while the salesperson hasn't started editing — never overwrites a draft.
  useEffect(() => {
    if (!value.text && !editedManually) {
      applyTemplate(value.templateKind);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advisorName]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          <User className="h-3.5 w-3.5 text-brand" />
          Your advisor
        </div>
        <div className="text-sm font-medium text-ink">{advisorName}</div>
        {advisorEmail && (
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-faint">
            <Mail className="h-3 w-3" /> {advisorEmail}
          </div>
        )}
        <label className="mt-3 block text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          Phone / WhatsApp shown to the customer
        </label>
        <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Phone className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
          <input
            value={value.advisorPhone ?? ""}
            onChange={(e) => onChange({ ...value, advisorPhone: e.target.value })}
            placeholder="+1 555 123 4567"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint/50"
          />
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Thank-you message</div>
        <div className="flex gap-1.5">
          {RECAP_MESSAGE_TEMPLATES.map((t) => (
            <button
              key={t.kind}
              type="button"
              onClick={() => applyTemplate(t.kind)}
              className={`flex-1 rounded-full px-3 py-2 text-xs font-medium transition ${
                value.templateKind === t.kind
                  ? "bg-brand text-white"
                  : "border border-white/10 bg-white/5 text-ink-muted hover:bg-white/10"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <textarea
          value={value.text}
          onChange={(e) => {
            setEditedManually(true);
            onChange({ ...value, text: e.target.value });
          }}
          rows={5}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50"
        />
        {editedManually && (
          <p className="mt-1 text-[11px] text-ink-faint">Edited from the template — your changes are kept.</p>
        )}
      </div>
    </div>
  );
}

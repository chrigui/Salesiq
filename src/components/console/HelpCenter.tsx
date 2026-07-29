"use client";

import { useMemo, useState } from "react";
import { Search, LifeBuoy, ChevronDown } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";

interface FaqEntry {
  q: string;
  a: string;
  group: string;
}

const FAQ: FaqEntry[] = [
  { group: "Getting started", q: "How do I create my first industry pack?", a: "Go to Industries → Create industry, fill in a name and vertical, then either use the Smart Wizard to generate content from a one-line description, or build questions/inventory/rules by hand in the Questions, Inventory and Scoring tabs." },
  { group: "Getting started", q: "What's the fastest way to get a working demo?", a: "Create a pack, then open the Smart Wizard from any of the Questions/Inventory/Scoring/Branding tabs and describe your business in a sentence — it generates a full working pack in seconds." },
  { group: "AI features", q: "Why do proposals say 'Deterministic writer' instead of being AI-authored?", a: "Every AI feature (Proposal Writer, Email Generator, Objection Handler, Smart Wizard) works fully offline with a deterministic fallback. Set ANTHROPIC_API_KEY in your environment to unlock Claude-authored prose — the UI is identical either way." },
  { group: "AI features", q: "What does 'Knowledge-only mode' do in AI Settings?", a: "It adds a strict guardrail telling Claude to use only the verified facts and Knowledge Base entries provided — no general knowledge or invented claims. Useful for regulated industries." },
  { group: "AI features", q: "Where do I add company facts the AI can quote?", a: "Knowledge Base, in the Main Menu. Entries there — financing terms, policies, warranty details — are sent to every AI proposal, email and objection response so it can quote your business accurately." },
  { group: "Leads & CRM", q: "How does a session become a lead?", a: "From the companion, tap Proposal → Save lead to CRM. The lead carries the item recommended, its real match score, and the customer's contact details if provided." },
  { group: "Leads & CRM", q: "Can I draft a follow-up email automatically?", a: "Yes — open any lead in Lead Management, pick a purpose (first follow-up, check-in, re-engagement, thank-you) under Follow-up email, and click Draft with AI." },
  { group: "Team & security", q: "How do I control what each role can do?", a: "Permissions, under Management, has a full capability matrix per role. Owner is always fully granted so there's never a lockout scenario." },
  { group: "Team & security", q: "Is my data backed up anywhere?", a: "Security & Compliance has a real Download backup / Restore from file flow, plus a GDPR data export and per-lead PII redaction tool." },
  { group: "Sync & devices", q: "How does the companion talk to the customer display?", a: "They pair over a room code (QR or 4-character code) and sync live over MQTT, with payloads encrypted per-room. If the connection drops, changes queue locally and sync automatically once it's back." },
];

/** Help Center (Module 11). A real, searchable FAQ — not a support ticket
 * queue, since there's no support backend in this pilot, but genuinely
 * useful self-serve content covering the product end to end. */
export function HelpCenter() {
  const [query, setQuery] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ;
    return FAQ.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q) || f.group.toLowerCase().includes(q));
  }, [query]);

  const groups = Array.from(new Set(filtered.map((f) => f.group)));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
        <Search className="h-4 w-4 text-zinc-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help articles…"
          className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-400">
          <LifeBuoy className="mx-auto mb-2 h-6 w-6 text-zinc-300" />
          No articles match &ldquo;{query}&rdquo;.
        </div>
      ) : (
        groups.map((group) => (
          <Panel key={group} title={group}>
            <div className="space-y-2">
              {filtered
                .filter((f) => f.group === group)
                .map((f) => {
                  const idx = FAQ.indexOf(f);
                  const open = openIdx === idx;
                  return (
                    <div key={f.q} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                      <button
                        onClick={() => setOpenIdx(open ? null : idx)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-zinc-900"
                      >
                        {f.q}
                        <ChevronDown className={cx("h-4 w-4 shrink-0 text-zinc-400 transition", open && "rotate-180")} />
                      </button>
                      {open && <p className="border-t border-zinc-100 px-4 py-3 text-sm text-zinc-500">{f.a}</p>}
                    </div>
                  );
                })}
            </div>
          </Panel>
        ))
      )}
    </div>
  );
}

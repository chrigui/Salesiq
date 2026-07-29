"use client";

import { useState } from "react";
import {
  ChevronDown,
  Users as UsersIcon,
  Sparkles,
  CalendarClock,
  Trophy,
  Mail,
  Loader2,
} from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { useUsers } from "@/core/data/users";
import {
  LEAD_STATUSES,
  updateLead,
  useLeads,
  type Lead,
  type LeadStatus,
} from "@/core/store/leads";
import { Field, Select, TextArea, TextInput } from "@/components/console/builder/fields";
import { getKnowledgeBase, knowledgePayload } from "@/core/data/knowledgeBase";
import { EMAIL_PURPOSES, type EmailPurpose } from "@/core/engine/email";

const STATUS_STYLE: Record<LeadStatus, string> = {
  new: "bg-sky-100 text-sky-700",
  contacted: "bg-amber-100 text-amber-700",
  qualified: "bg-violet-100 text-violet-700",
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-zinc-200 text-zinc-500",
};

function timeAgo(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Lead Management (Module 3). Create happens on the companion (a live
 * session becomes a lead via "Save lead to CRM"); this is where a manager
 * triages the pipeline — status, assignment and follow-up — the Edit/Assign/
 * Follow-up/Status half of the spec's bullet list.
 */
export function LeadManagement() {
  const leads = useLeads();
  const users = useUsers();
  const [openId, setOpenId] = useState<string | null>(null);

  const now = Date.now();
  const dueSoon = leads.filter(
    (l) =>
      l.followUpAt != null &&
      l.followUpAt <= now + 7 * 24 * 60 * 60 * 1000 &&
      l.status !== "won" &&
      l.status !== "lost",
  ).length;
  const won = leads.filter((l) => l.status === "won").length;
  const fresh = leads.filter((l) => l.status === "new").length;

  const assignable = users.filter((u) => u.status === "active");
  const userName = (id: string | null) =>
    id ? users.find((u) => u.id === id)?.name ?? "—" : "Unassigned";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <SummaryCard icon={UsersIcon} label="Total leads" value={String(leads.length)} />
        <SummaryCard icon={Sparkles} label="New" value={String(fresh)} tone="new" />
        <SummaryCard icon={CalendarClock} label="Follow-ups due" value={String(dueSoon)} tone="due" />
        <SummaryCard icon={Trophy} label="Won" value={String(won)} tone="won" />
      </div>

      <Panel title="Leads">
        {leads.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">
            Leads captured from live sessions appear here in real time. Run a
            session and tap{" "}
            <span className="text-zinc-600">Save lead to CRM</span> in the
            companion.
          </p>
        ) : (
          <div className="space-y-2">
            {leads.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                open={openId === lead.id}
                onToggle={() => setOpenId(openId === lead.id ? null : lead.id)}
                assignable={assignable}
                userName={userName}
              />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof UsersIcon;
  label: string;
  value: string;
  tone?: "new" | "due" | "won";
}) {
  const toneClass =
    tone === "new"
      ? "text-sky-600"
      : tone === "due"
        ? "text-amber-600"
        : tone === "won"
          ? "text-emerald-600"
          : "text-zinc-900";
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className={cx("mt-2 text-2xl font-bold tracking-tight tabular-nums", toneClass)}>
        {value}
      </div>
    </div>
  );
}

function LeadRow({
  lead,
  open,
  onToggle,
  assignable,
  userName,
}: {
  lead: Lead;
  open: boolean;
  onToggle: () => void;
  assignable: { id: string; name: string }[];
  userName: (id: string | null) => string;
}) {
  const patch = (p: Partial<Lead>) => updateLead(lead.id, p);
  const overdue =
    lead.followUpAt != null &&
    lead.followUpAt < Date.now() &&
    lead.status !== "won" &&
    lead.status !== "lost";

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <button onClick={onToggle} className="flex flex-1 items-center gap-3 text-left">
          <div>
            <div className="text-sm font-medium text-zinc-900">{lead.name}</div>
            <div className="text-xs text-zinc-400">{lead.itemName} · {lead.packLabel}</div>
          </div>
        </button>

        <span className="text-sm font-semibold text-zinc-900 tabular-nums">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: lead.currency,
            maximumFractionDigits: 0,
          }).format(lead.price)}
        </span>
        <span className="text-xs font-semibold text-zinc-400 tabular-nums">{lead.score}</span>

        <span className={cx("rounded-full px-2.5 py-1 text-xs font-medium capitalize", STATUS_STYLE[lead.status])}>
          {lead.status}
        </span>

        <span className="text-xs text-zinc-400">{userName(lead.assignedTo)}</span>

        {lead.followUpAt != null && (
          <span className={cx("text-xs", overdue ? "font-medium text-rose-600" : "text-zinc-400")}>
            {overdue ? "Overdue " : "Follow up "}{formatDate(lead.followUpAt)}
          </span>
        )}

        <span className="text-xs text-zinc-400">{timeAgo(lead.createdAt)}</span>

        <button
          onClick={onToggle}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100"
        >
          <ChevronDown className={cx("h-4 w-4 transition", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <div className="space-y-4 border-t border-zinc-100 px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Status">
              <Select
                value={lead.status}
                onChange={(e) => patch({ status: e.target.value as LeadStatus })}
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Assigned to">
              <Select
                value={lead.assignedTo ?? ""}
                onChange={(e) => patch({ assignedTo: e.target.value || null })}
              >
                <option value="">Unassigned</option>
                {assignable.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Follow-up date">
              <TextInput
                type="date"
                value={lead.followUpAt ? new Date(lead.followUpAt).toISOString().slice(0, 10) : ""}
                onChange={(e) =>
                  patch({
                    followUpAt: e.target.value ? new Date(e.target.value).getTime() : null,
                  })
                }
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <TextInput value={lead.name} onChange={(e) => patch({ name: e.target.value })} />
            </Field>
            <Field label="Phone">
              <TextInput value={lead.phone} onChange={(e) => patch({ phone: e.target.value })} />
            </Field>
            <Field label="Email" className="sm:col-span-2">
              <TextInput value={lead.email} onChange={(e) => patch({ email: e.target.value })} />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <TextArea rows={2} value={lead.notes} onChange={(e) => patch({ notes: e.target.value })} />
            </Field>
          </div>

          <EmailGenerator lead={lead} />
        </div>
      )}
    </div>
  );
}

/**
 * Email Generator (Module 6). Drafts a follow-up email for this lead —
 * outreach cadence after the fact, distinct from the Proposal Writer's
 * point-of-sale letter generated live in the companion. Deterministic
 * templates by default; Claude-authored when ANTHROPIC_API_KEY is set (see
 * /api/ai/email), always falling back to the template on any error.
 */
function EmailGenerator({ lead }: { lead: Lead }) {
  const [purpose, setPurpose] = useState<EmailPurpose>("first-followup");
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);
  const [engine, setEngine] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId: lead.packId,
          purpose,
          customerName: lead.name,
          itemName: lead.itemName,
          price: lead.price,
          currency: lead.currency,
          notes: lead.notes,
          knowledge: knowledgePayload(getKnowledgeBase()),
        }),
      });
      const data = await res.json();
      if (data?.subject && data?.body) {
        setDraft({ subject: data.subject, body: data.body });
        setEngine(data.engine ?? null);
      }
    } catch {
      // Network/route failure — leave any previously drafted email as-is.
    } finally {
      setLoading(false);
    }
  };

  const mailtoUrl =
    lead.email && draft
      ? `mailto:${encodeURIComponent(lead.email)}?subject=${encodeURIComponent(
          draft.subject,
        )}&body=${encodeURIComponent(draft.body)}`
      : null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Follow-up email
        </div>
        <Select
          value={purpose}
          onChange={(e) => setPurpose(e.target.value as EmailPurpose)}
          className="w-auto"
        >
          {EMAIL_PURPOSES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </Select>
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        {loading ? "Drafting…" : draft ? "Redraft with AI" : "Draft with AI"}
      </button>

      {draft && (
        <div className="mt-3 space-y-2 rounded-xl border border-zinc-200 bg-white p-3">
          <div className="text-xs font-medium text-zinc-900">{draft.subject}</div>
          <p className="whitespace-pre-line text-xs text-zinc-500">{draft.body}</p>
          {engine && (
            <p className="text-[10px] text-zinc-400">
              {engine === "claude+email"
                ? "Authored by Claude from verified facts."
                : "Deterministic template — set ANTHROPIC_API_KEY for Claude-authored prose."}
            </p>
          )}
          <DeliveryLink href={mailtoUrl} disabledHint="Add an email address above first" />
        </div>
      )}
    </div>
  );
}

function DeliveryLink({ href, disabledHint }: { href: string | null; disabledHint: string }) {
  if (!href) {
    return (
      <span
        title={disabledHint}
        className="inline-flex cursor-not-allowed items-center gap-1.5 text-xs font-medium text-zinc-300"
      >
        <Mail className="h-3.5 w-3.5" /> Send email
      </span>
    );
  }
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:brightness-110"
    >
      <Mail className="h-3.5 w-3.5" /> Send email
    </a>
  );
}

"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  Mail,
  MessageCircle,
  ExternalLink,
  Eye,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { PACKS } from "@/core/industries";
import {
  useBrochure,
  useBrochureAnalytics,
  updateBrochure,
  type BrochureTemplate,
  type BrochureTheme,
} from "@/core/store/brochures";

const TABS = ["Widgets", "Share", "Analytics", "Activity"] as const;
type Tab = (typeof TABS)[number];

const TEMPLATES: BrochureTemplate[] = ["Modern", "Luxury", "Minimal"];
const THEMES: BrochureTheme[] = ["Light", "Dark", "Auto", "Brand"];

const WIDGET_LABELS: Record<string, string> = {
  hero: "Hero",
  gallery: "Gallery",
  highlights: "Highlights",
  specs: "Specs",
  map: "Map",
  investment: "Investment & comparables",
  documents: "Documents",
  leadForm: "Lead capture form",
};

export function BrochureEditor({ id, onBack }: { id: string; onBack: () => void }) {
  const { brochure, isLoading } = useBrochure(id);
  const [tab, setTab] = useState<Tab>("Widgets");

  if (isLoading || !brochure) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading brochure…
      </div>
    );
  }

  const pack = PACKS.find((p) => p.id === brochure.packId);
  const item = pack?.inventory.find((i) => i.id === brochure.itemId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div>
          <div className="text-base font-semibold text-zinc-900">
            {item?.name ?? "Listing removed"}
          </div>
          <div className="text-xs text-zinc-400">{pack?.label ?? brochure.packId}</div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <select
            value={brochure.status}
            onChange={(e) => updateBrochure(id, { status: e.target.value as typeof brochure.status })}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          >
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Archived">Archived</option>
          </select>
          <a
            href={`/b/${brochure.slug}?preview=1`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <Eye className="h-4 w-4" /> Preview
          </a>
        </div>
      </div>

      <div className="flex gap-1 border-b border-zinc-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cx(
              "px-3 py-2 text-sm font-medium transition",
              tab === t
                ? "border-b-2 border-zinc-900 text-zinc-900"
                : "text-zinc-400 hover:text-zinc-600",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Widgets" && <WidgetsTab id={id} brochure={brochure} />}
      {tab === "Share" && <ShareTab brochure={brochure} />}
      {tab === "Analytics" && <AnalyticsTab id={id} />}
      {tab === "Activity" && <ActivityTab id={id} />}
    </div>
  );
}

function WidgetsTab({
  id,
  brochure,
}: {
  id: string;
  brochure: NonNullable<ReturnType<typeof useBrochure>["brochure"]>;
}) {
  const [sections, setSections] = useState(brochure.sections);
  useEffect(() => setSections(brochure.sections), [brochure.sections]);

  const commit = (next: typeof sections) => {
    setSections(next);
    updateBrochure(id, { sections: next });
  };

  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= sections.length) return;
    const next = [...sections];
    [next[index], next[to]] = [next[to], next[index]];
    commit(next.map((s, i) => ({ ...s, order: i })));
  };

  const toggle = (idx: number) =>
    commit(sections.map((s, i) => (i === idx ? { ...s, enabled: !s.enabled } : s)));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Sections">
        <div className="space-y-2">
          {sections.map((s, i) => (
            <div
              key={s.id}
              className={cx(
                "flex items-center gap-2 rounded-2xl border px-3 py-2.5",
                s.enabled ? "border-zinc-200 bg-white" : "border-zinc-100 bg-zinc-50",
              )}
            >
              <label className="flex flex-1 items-center gap-2">
                <input
                  type="checkbox"
                  checked={s.enabled}
                  onChange={() => toggle(i)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <span className={cx("text-sm font-medium", !s.enabled && "text-zinc-400")}>
                  {WIDGET_LABELS[s.type] ?? s.type}
                </span>
              </label>
              <div className="flex items-center gap-0.5">
                <IconBtn label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </IconBtn>
                <IconBtn label="Move down" disabled={i === sections.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </IconBtn>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Template & theme">
        <div className="space-y-4">
          <div>
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Template
            </span>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t}
                  onClick={() => updateBrochure(id, { template: t })}
                  className={cx(
                    "rounded-xl border px-3 py-2 text-sm font-medium transition",
                    brochure.template === t
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Theme
            </span>
            <div className="flex flex-wrap gap-2">
              {THEMES.map((t) => (
                <button
                  key={t}
                  onClick={() => updateBrochure(id, { theme: t })}
                  className={cx(
                    "rounded-xl border px-3 py-2 text-sm font-medium transition",
                    brochure.theme === t
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <p className="flex items-start gap-1.5 text-[11px] text-zinc-400">
            <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
            AI-polished English &amp; Arabic copy for the Highlights widget is
            generated on the microsite itself the first time it&apos;s viewed with
            AI enabled — no extra step here.
          </p>
        </div>
      </Panel>
    </div>
  );
}

function ShareTab({ brochure }: { brochure: { slug: string } }) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/b/${brochure.slug}` : "";
  const qrUrl = url ? `${url}?src=qr` : "";

  useEffect(() => {
    if (!qrUrl) return;
    QRCode.toDataURL(qrUrl, { margin: 1, width: 220, color: { dark: "#0a0f1c", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [qrUrl]);

  const message = `Take a look: ${url}`;
  const mailtoUrl = `mailto:?subject=${encodeURIComponent("A listing you might like")}&body=${encodeURIComponent(message)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="QR code">
        <div className="flex flex-col items-center gap-3 py-2">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="Brochure QR code" width={200} height={200} className="rounded-xl" />
          ) : (
            <div className="h-[200px] w-[200px] animate-pulse rounded-xl bg-zinc-100" />
          )}
          <p className="text-center text-xs text-zinc-400">
            Scans are tracked separately from regular views in Analytics.
          </p>
        </div>
      </Panel>

      <Panel title="Permanent link">
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
            <span className="flex-1 truncate text-sm text-zinc-700">{url}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <a
              href={mailtoUrl}
              className="flex flex-col items-center gap-1 rounded-xl border border-zinc-200 py-2.5 text-zinc-600 transition hover:bg-zinc-50"
            >
              <Mail className="h-4 w-4" />
              <span className="text-[11px] font-medium">Email</span>
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-1 rounded-xl border border-zinc-200 py-2.5 text-zinc-600 transition hover:bg-zinc-50"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-[11px] font-medium">WhatsApp</span>
            </a>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-1 rounded-xl border border-zinc-200 py-2.5 text-zinc-600 transition hover:bg-zinc-50"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="text-[11px] font-medium">Open</span>
            </a>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function AnalyticsTab({ id }: { id: string }) {
  const analytics = useBrochureAnalytics(id);

  if (!analytics) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading analytics…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Views" value={analytics.views} />
        <StatCard label="QR scans" value={analytics.scans} />
        <StatCard label="Share clicks" value={analytics.clicks} />
        <StatCard label="Leads captured" value={analytics.leads} />
      </div>

      <Panel title="Daily activity">
        {analytics.daily.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-400">
            No real visits recorded yet — numbers appear here the moment
            someone opens the microsite.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.daily} margin={{ left: -20, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
              <XAxis dataKey="date" tick={{ fill: "#a1a1aa", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="views" stackId="a" fill="#18181b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="scans" stackId="a" fill="#71717a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="clicks" stackId="a" fill="#d4d4d8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Panel>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="text-2xl font-semibold text-zinc-900">{value.toLocaleString()}</div>
      <div className="text-xs text-zinc-400">{label}</div>
    </div>
  );
}

function ActivityTab({ id }: { id: string }) {
  const [entries, setEntries] = useState<
    { id: string; ts: number; actor: string; action: string; detail: string }[] | null
  >(null);
  const [restricted, setRestricted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/audit?target=${id}`)
      .then((res) => {
        if (res.status === 403) {
          setRestricted(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled || !data) return;
        setEntries(data.entries);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (restricted) {
    return (
      <p className="py-10 text-center text-sm text-zinc-400">
        Activity history requires the &quot;Manage security &amp; compliance&quot; permission.
      </p>
    );
  }
  if (!entries) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <Panel title="Activity">
      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-400">No recorded actions yet.</p>
      ) : (
        <div className="divide-y divide-zinc-100">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="flex-1 text-zinc-700">
                <span className="font-medium">{e.actor}</span> · {e.detail}
              </span>
              <span className="shrink-0 text-xs text-zinc-400">
                {new Date(e.ts).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function IconBtn({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

"use client";

import { useRef, useState } from "react";
import {
  ShieldCheck,
  Download,
  Upload,
  Eraser,
  ScrollText,
  Lock,
  Server,
} from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { Field, Select, TextInput } from "@/components/console/builder/fields";
import { useSession } from "@/core/data/auth";
import { SSO_PROVIDERS, saveSsoSettings, useSsoSettings, type SsoProvider } from "@/core/data/ssoSettings";
import { downloadBackup, restoreBackup } from "@/core/data/backup";
import { useLeads, redactLeadPII } from "@/core/store/leads";
import { useTenantAuditLog } from "@/core/data/tenantAuditLog";

function timeAgo(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/**
 * Security & Compliance (Module 10 · Enterprise Features). SSO
 * configuration, GDPR data export / right-to-be-forgotten, local backup &
 * restore, an illustrative reliability panel, and the tenant audit trail —
 * gated behind "security.manage" like billing and user management.
 */
export function SecurityCompliance() {
  const session = useSession();
  const actor = session?.name ?? "Unknown";

  return (
    <div className="space-y-4">
      <SsoPanel actor={actor} />
      <DataPrivacyPanel actor={actor} />
      <BackupPanel actor={actor} />
      <ReliabilityPanel />
      <AuditTrailPanel />
    </div>
  );
}

function SsoPanel({ actor }: { actor: string }) {
  const sso = useSsoSettings();
  const [draft, setDraft] = useState(sso);
  const dirty = JSON.stringify(draft) !== JSON.stringify(sso);

  return (
    <Panel title="Single sign-on">
      <p className="mb-4 text-sm text-zinc-500">
        Configure SSO for this workspace. Settings are saved and every
        change is audited — this pilot isn&rsquo;t wired to a real identity
        provider yet, so sign-in itself still uses the demo password below.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Provider">
          <Select
            value={draft.provider}
            onChange={(e) => setDraft({ ...draft, provider: e.target.value as SsoProvider })}
          >
            {SSO_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Client / App ID">
          <TextInput
            value={draft.clientId}
            onChange={(e) => setDraft({ ...draft, clientId: e.target.value })}
            placeholder="00000000-0000-0000-0000-000000000000"
          />
        </Field>
        <Field label="Metadata / issuer URL" className="sm:col-span-2">
          <TextInput
            value={draft.metadataUrl}
            onChange={(e) => setDraft({ ...draft, metadataUrl: e.target.value })}
            placeholder="https://login.microsoftonline.com/…/federationmetadata.xml"
          />
        </Field>
      </div>
      <button
        onClick={() => setDraft({ ...draft, enforced: !draft.enforced })}
        className={cx(
          "mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition",
          draft.enforced ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
        )}
      >
        <Lock className="h-3.5 w-3.5" /> Require SSO for sign-in
      </button>
      {dirty && (
        <button
          onClick={() => saveSsoSettings(draft, actor)}
          className="ml-2 mt-3 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Save
        </button>
      )}
    </Panel>
  );
}

function DataPrivacyPanel({ actor }: { actor: string }) {
  const leads = useLeads();
  const identifiable = leads.filter((l) => l.name !== "Redacted" && (l.email || l.phone));

  return (
    <Panel title="Data & privacy (GDPR)">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          Export every record this workspace holds, or redact a lead&rsquo;s
          personal details on request.
        </p>
        <button
          onClick={() => downloadBackup(actor)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110"
        >
          <Download className="h-3.5 w-3.5" /> Export all data
        </button>
      </div>

      {identifiable.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 py-8 text-center text-sm text-zinc-400">
          No leads with personal details on file.
        </div>
      ) : (
        <div className="space-y-2">
          {identifiable.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
              <div>
                <div className="text-sm font-medium text-zinc-900">{l.name}</div>
                <div className="text-xs text-zinc-400">{l.email || l.phone || "—"}</div>
              </div>
              <button
                onClick={() => {
                  if (confirm(`Redact ${l.name}'s personal details? This can't be undone.`)) {
                    redactLeadPII(l.id);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <Eraser className="h-3.5 w-3.5" /> Redact PII
              </button>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function BackupPanel({ actor }: { actor: string }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    const result = await restoreBackup(file, actor);
    setMessage(result.ok ? "Backup restored — reload to see the changes." : (result.error ?? "Restore failed."));
  };

  return (
    <Panel title="Backup & restore">
      <p className="mb-4 text-sm text-zinc-500">
        Downloads every record this browser holds for this workspace as one
        JSON file, and can restore from one — scoped to this browser&rsquo;s local
        data, since there&rsquo;s no server-side store behind this pilot.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => downloadBackup(actor)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        >
          <Download className="h-4 w-4" /> Download backup
        </button>
        <button
          onClick={() => fileInput.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50"
        >
          <Upload className="h-4 w-4" /> Restore from file
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
      {message && <p className="mt-3 text-xs text-zinc-500">{message}</p>}
    </Panel>
  );
}

function ReliabilityPanel() {
  return (
    <Panel title="Reliability">
      <p className="mb-4 text-sm text-zinc-500">
        Illustrative pilot targets — there&rsquo;s no multi-region infrastructure
        behind this demo to actually fail over.
      </p>
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Uptime (90d)", value: "99.97%" },
          { label: "RPO target", value: "< 5 min" },
          { label: "RTO target", value: "< 30 min" },
          { label: "Regions", value: "2 (active/standby)" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              <Server className="h-3 w-3" /> {s.label}
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums text-zinc-900">{s.value}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AuditTrailPanel() {
  const entries = useTenantAuditLog();

  return (
    <Panel title="Audit trail">
      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-400">
          <ScrollText className="mx-auto mb-2 h-6 w-6 text-zinc-300" />
          Account-level changes — users, permissions, branches, plan —
          will appear here as they happen.
        </div>
      ) : (
        <ol className="space-y-1">
          {entries.map((entry, i) => (
            <li key={entry.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-500">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
                {i < entries.length - 1 && <span className="w-px flex-1 bg-zinc-100" />}
              </div>
              <div className="pb-4">
                <p className="text-sm leading-snug text-zinc-900">
                  <span className="font-medium">{entry.action}</span> — {entry.target}
                </p>
                <p className="text-xs text-zinc-400">
                  {entry.detail} · {entry.actor} · {timeAgo(entry.ts)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

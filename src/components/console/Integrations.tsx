"use client";

import { useState } from "react";
import { Mail, MessageCircle, Webhook, CalendarClock, Building2, MessageSquareText, Send, Check, X } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { Field, TextInput } from "@/components/console/builder/fields";
import { fireWebhook, saveIntegrationSettings, useIntegrationSettings } from "@/core/data/integrations";

function timeAgo(ts: number | null): string {
  if (ts == null) return "never";
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/**
 * Integrations (Module 4). A pilot-scoped integration layer: a real outbound
 * webhook fired straight from the browser (Save lead to CRM in the
 * companion), the Email/WhatsApp delivery channels already wired into the
 * Proposal Writer and Email Generator, and honest "not connected" cards for
 * the third-party syncs (Calendar, CRM, SMS) that would need a real backend
 * and OAuth this pilot doesn't have.
 */
export function Integrations() {
  const settings = useIntegrationSettings();
  const [sending, setSending] = useState(false);

  const sendTest = async () => {
    if (sending || !settings.webhookUrl) return;
    setSending(true);
    try {
      await fireWebhook("test.ping", {
        message: "Test event from SalesIQ Integrations",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <Panel title="Webhook">
        <p className="mb-4 text-sm text-zinc-500">
          Fires a real HTTP POST from the browser whenever a lead is saved
          from the companion — point it at Zapier, Make, or your own
          endpoint. Only works with receivers that accept cross-origin
          requests, since there&rsquo;s no backend relay in this pilot.
        </p>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Field label="Endpoint URL">
            <TextInput
              value={settings.webhookUrl}
              onChange={(e) => saveIntegrationSettings({ webhookUrl: e.target.value })}
              placeholder="https://hooks.example.com/salesiq"
            />
          </Field>
          <div className="flex items-end gap-2">
            <button
              onClick={() => saveIntegrationSettings({ webhookEnabled: !settings.webhookEnabled })}
              className={cx(
                "flex h-[42px] items-center gap-2 rounded-xl border px-3 text-sm font-medium transition",
                settings.webhookEnabled
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
              )}
            >
              {settings.webhookEnabled ? "Enabled" : "Disabled"}
            </button>
            <button
              onClick={sendTest}
              disabled={sending || !settings.webhookUrl}
              className="flex h-[42px] items-center gap-1.5 rounded-xl bg-zinc-900 px-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" /> Send test
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-400">
          Last fired: {settings.lastEvent ? `${settings.lastEvent} · ` : ""}
          {timeAgo(settings.lastFiredAt)}
          {settings.lastStatus && (
            <span
              className={cx(
                "ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium",
                settings.lastStatus === "ok"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700",
              )}
            >
              {settings.lastStatus === "ok" ? "delivered" : "failed"}
            </span>
          )}
        </p>
      </Panel>

      <Panel title="Delivery channels">
        <div className="grid gap-3 sm:grid-cols-2">
          <IntegrationCard
            icon={Mail}
            name="Email"
            detail="Proposals and follow-up emails send via mailto: — the customer's own mail client, no backend needed."
            connected
          />
          <IntegrationCard
            icon={MessageCircle}
            name="WhatsApp"
            detail="Proposals send via a wa.me deep link once the customer's phone number is on file."
            connected
          />
          <IntegrationCard
            icon={CalendarClock}
            name="Calendar sync"
            detail="Two-way follow-up scheduling with Google/Outlook calendars — needs a backend + OAuth this pilot doesn't have."
            connected={false}
          />
          <IntegrationCard
            icon={Building2}
            name="External CRM"
            detail="Push/pull leads with Salesforce, HubSpot, or Pipedrive — use the webhook above as an interim bridge."
            connected={false}
          />
          <IntegrationCard
            icon={MessageSquareText}
            name="SMS"
            detail="Text-message follow-ups via Twilio or a similar provider — needs a backend this pilot doesn't have."
            connected={false}
          />
          <IntegrationCard
            icon={Webhook}
            name="Custom webhook"
            detail="Configured above — any receiver that accepts a JSON POST."
            connected={settings.webhookEnabled && !!settings.webhookUrl}
          />
        </div>
      </Panel>
    </div>
  );
}

function IntegrationCard({
  icon: Icon,
  name,
  detail,
  connected,
}: {
  icon: typeof Mail;
  name: string;
  detail: string;
  connected: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-500">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-900">{name}</span>
          <span
            className={cx(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
              connected ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-400",
            )}
          >
            {connected ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
            {connected ? "Active" : "Not connected"}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">{detail}</p>
      </div>
    </div>
  );
}

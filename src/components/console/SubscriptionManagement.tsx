"use client";

import { useState } from "react";
import {
  Check,
  ArrowUpCircle,
  ArrowDownCircle,
  XCircle,
  RotateCcw,
  Download,
  CalendarClock,
} from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import {
  PLANS,
  changePlan,
  cancelSubscription,
  reactivateSubscription,
  useSubscription,
  type PlanId,
} from "@/core/data/subscription";
import { logTenantAudit } from "@/core/data/tenantAuditLog";
import { useSession } from "@/core/data/auth";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  trialing: "bg-sky-100 text-sky-700",
  canceled: "bg-zinc-200 text-zinc-500",
  past_due: "bg-rose-100 text-rose-700",
};

function formatDate(ts: number | null): string {
  if (ts == null) return "—";
  return new Date(ts).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Subscription Management (Module 1, final Platform Foundation feature).
 * Trial / Monthly / Annual / Enterprise plans with upgrade, downgrade,
 * cancel and billing history — gated behind the "billing.manage" capability
 * from the Permission Engine, same as the rest of the org-level surfaces.
 */
export function SubscriptionManagement() {
  const sub = useSubscription();
  const session = useSession();
  const actor = session?.name ?? "Unknown";
  const [confirmPlan, setConfirmPlan] = useState<PlanId | null>(null);
  const currentPlan = PLANS.find((p) => p.id === sub.plan)!;
  const currentIndex = PLANS.findIndex((p) => p.id === sub.plan);

  return (
    <div className="space-y-4">
      <Panel title="Current plan">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-zinc-900">{currentPlan.name}</span>
              <span className={cx("rounded-full px-2.5 py-1 text-xs font-medium capitalize", STATUS_STYLE[sub.status])}>
                {sub.status.replace("_", " ")}
              </span>
            </div>
            <div className="mt-1 text-sm text-zinc-500">
              {currentPlan.price == null ? "Custom pricing" : `$${currentPlan.price}/mo`} · {sub.seats} seats
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400">
              <CalendarClock className="h-3.5 w-3.5" />
              {sub.status === "trialing"
                ? `Trial ends ${formatDate(sub.trialEndsAt)}`
                : sub.status === "canceled"
                  ? `Access ends ${formatDate(sub.renewsAt)}`
                  : `Renews ${formatDate(sub.renewsAt)}`}
            </div>
          </div>
          {sub.status === "canceled" ? (
            <button
              onClick={() => {
                reactivateSubscription();
                logTenantAudit({ actor, action: "Reactivated subscription", target: currentPlan.name, detail: "Subscription reactivated" });
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            >
              <RotateCcw className="h-4 w-4" /> Reactivate
            </button>
          ) : (
            <button
              onClick={() => {
                if (confirm("Cancel your subscription? You'll keep access until the end of the current period.")) {
                  cancelSubscription();
                  logTenantAudit({ actor, action: "Canceled subscription", target: currentPlan.name, detail: "Access continues until period end" });
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 hover:text-rose-600"
            >
              <XCircle className="h-4 w-4" /> Cancel subscription
            </button>
          )}
        </div>
      </Panel>

      <Panel title="Plans">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan, i) => {
            const isCurrent = plan.id === sub.plan;
            const isUpgrade = i > currentIndex;
            return (
              <div
                key={plan.id}
                className={cx(
                  "flex flex-col rounded-2xl border p-4",
                  isCurrent ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200",
                )}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-semibold text-zinc-900">{plan.name}</span>
                  {isCurrent && (
                    <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-white">
                      Current
                    </span>
                  )}
                </div>
                <div className="mb-1 text-2xl font-bold tracking-tight text-zinc-900">
                  {plan.price == null ? "Custom" : `$${plan.price}`}
                </div>
                <div className="mb-3 text-xs text-zinc-400">{plan.cadence}</div>
                <p className="mb-3 text-xs text-zinc-500">{plan.blurb}</p>
                <ul className="mb-4 flex-1 space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-zinc-600">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  disabled={isCurrent}
                  onClick={() => setConfirmPlan(plan.id)}
                  className={cx(
                    "inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition",
                    isCurrent
                      ? "cursor-default bg-zinc-100 text-zinc-400"
                      : "bg-zinc-900 text-white hover:brightness-110",
                  )}
                >
                  {isCurrent ? (
                    "Current plan"
                  ) : isUpgrade ? (
                    <>
                      <ArrowUpCircle className="h-4 w-4" /> Upgrade
                    </>
                  ) : (
                    <>
                      <ArrowDownCircle className="h-4 w-4" /> Downgrade
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Billing history">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Description</th>
                <th className="pb-3 text-right font-medium">Amount</th>
                <th className="pb-3 text-right font-medium">Status</th>
                <th className="pb-3 text-right font-medium">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {sub.history.map((entry) => (
                <tr key={entry.id} className="border-t border-zinc-100">
                  <td className="py-3 text-zinc-500">{formatDate(entry.date)}</td>
                  <td className="py-3 text-zinc-900">{entry.description}</td>
                  <td className="py-3 text-right tabular-nums text-zinc-900">
                    ${entry.amount.toLocaleString()}
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={cx(
                        "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                        entry.status === "paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : entry.status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700",
                      )}
                    >
                      {entry.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      className="inline-flex items-center gap-1 text-xs text-zinc-500 transition hover:text-zinc-900"
                      title="Download invoice"
                    >
                      <Download className="h-3.5 w-3.5" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
              {sub.history.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-zinc-400">
                    No invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {confirmPlan && (
        <ConfirmDialog
          planId={confirmPlan}
          isUpgrade={PLANS.findIndex((p) => p.id === confirmPlan) > currentIndex}
          onCancel={() => setConfirmPlan(null)}
          onConfirm={() => {
            const newPlan = PLANS.find((p) => p.id === confirmPlan);
            changePlan(confirmPlan);
            setConfirmPlan(null);
            logTenantAudit({
              actor,
              action: "Changed plan",
              target: newPlan?.name ?? confirmPlan,
              detail: `${currentPlan.name} → ${newPlan?.name ?? confirmPlan}`,
            });
          }}
        />
      )}
    </div>
  );
}

function ConfirmDialog({
  planId,
  isUpgrade,
  onCancel,
  onConfirm,
}: {
  planId: PlanId;
  isUpgrade: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const plan = PLANS.find((p) => p.id === planId)!;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1.5 text-base font-semibold text-zinc-900">
          {isUpgrade ? "Upgrade" : "Downgrade"} to {plan.name}?
        </h3>
        <p className="mb-4 text-sm text-zinc-500">
          {plan.price == null
            ? "Our team will reach out to set up custom pricing and SLAs."
            : `You'll be billed $${plan.price} ${plan.cadence.includes("month") ? "" : plan.cadence} starting today.`}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Confirm {isUpgrade ? "upgrade" : "downgrade"}
          </button>
        </div>
      </div>
    </div>
  );
}

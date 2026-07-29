"use client";

import { useState } from "react";
import { Plus, Trash2, Ticket, Receipt, CreditCard } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { Field, NumberInput, TextInput } from "@/components/console/builder/fields";
import { usePlatformTenants } from "@/core/data/platformTenants";
import { createCoupon, deleteCoupon, toggleCoupon, useCoupons } from "@/core/data/coupons";
import { saveTaxRate, useTaxRate } from "@/core/data/billingSettings";

const INVOICE_STATUS: Record<string, { label: string; style: string }> = {
  paid: { label: "Paid", style: "bg-emerald-100 text-emerald-700" },
  pending: { label: "Pending", style: "bg-amber-100 text-amber-700" },
  overdue: { label: "Overdue", style: "bg-rose-100 text-rose-700" },
};

function statusForHealth(health: string): keyof typeof INVOICE_STATUS {
  if (health === "at-risk") return "overdue";
  if (health === "watch") return "pending";
  return "paid";
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Billing Center (Module 5). Invoices and payments are derived, read-only
 * views over the tenant store (one invoice per tenant per billing period,
 * status correlated with account health) — there's no real payment
 * processor behind this pilot, so nothing here pretends to move real
 * money. Coupons are the one genuinely mutable resource: create, retire,
 * delete, each logged to the audit trail. Tax rate is a real, persisted
 * platform setting applied to every invoice shown.
 */
export function BillingCenter() {
  const tenants = usePlatformTenants();
  const coupons = useCoupons();
  const taxPct = useTaxRate();
  const [taxDraft, setTaxDraft] = useState<number | null>(null);

  const now = new Date();
  const period = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const invoices = tenants.map((t) => {
    const status = statusForHealth(t.health);
    const tax = Math.round(t.mrr * (taxPct / 100));
    return {
      id: `INV-${t.id.slice(0, 4).toUpperCase()}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`,
      tenant: t.name,
      amount: t.mrr,
      tax,
      total: t.mrr + tax,
      status,
    };
  });
  const paid = invoices.filter((i) => i.status === "paid");
  const totalRevenue = invoices.reduce((sum, i) => sum + i.total, 0);
  const totalCollected = paid.reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            <Receipt className="h-3.5 w-3.5" /> Billed this period
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-zinc-900">
            ${totalRevenue.toLocaleString()}
          </div>
          <div className="text-xs text-zinc-400">{period}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            <CreditCard className="h-3.5 w-3.5" /> Collected
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-emerald-600">
            ${totalCollected.toLocaleString()}
          </div>
          <div className="text-xs text-zinc-400">
            {paid.length} of {invoices.length} invoices paid
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Tax rate
          </div>
          <div className="mt-2 flex items-center gap-2">
            <NumberInput
              value={taxDraft ?? taxPct}
              min={0}
              max={30}
              step={0.5}
              onValue={(v) => setTaxDraft(v ?? 0)}
              className="w-20"
            />
            <span className="text-sm text-zinc-500">%</span>
            {taxDraft != null && taxDraft !== taxPct && (
              <button
                onClick={() => {
                  saveTaxRate(taxDraft);
                  setTaxDraft(null);
                }}
                className="rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
              >
                Save
              </button>
            )}
          </div>
          <div className="mt-1 text-xs text-zinc-400">Applied to every invoice</div>
        </div>
      </div>

      <Panel title="Invoices & payments">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="pb-3 font-medium">Invoice</th>
                <th className="pb-3 font-medium">Tenant</th>
                <th className="pb-3 text-right font-medium">Amount</th>
                <th className="pb-3 text-right font-medium">Tax</th>
                <th className="pb-3 text-right font-medium">Total</th>
                <th className="pb-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-zinc-100">
                  <td className="py-3 font-mono text-xs text-zinc-500">{inv.id}</td>
                  <td className="py-3 font-medium text-zinc-900">{inv.tenant}</td>
                  <td className="py-3 text-right tabular-nums text-zinc-600">
                    ${inv.amount.toLocaleString()}
                  </td>
                  <td className="py-3 text-right tabular-nums text-zinc-400">
                    ${inv.tax.toLocaleString()}
                  </td>
                  <td className="py-3 text-right tabular-nums font-medium text-zinc-900">
                    ${inv.total.toLocaleString()}
                  </td>
                  <td className="py-3 text-right">
                    <span className={cx("rounded-full px-2.5 py-1 text-xs font-medium", INVOICE_STATUS[inv.status].style)}>
                      {INVOICE_STATUS[inv.status].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <CouponsPanel coupons={coupons} />
    </div>
  );
}

function CouponsPanel({ coupons }: { coupons: ReturnType<typeof useCoupons> }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [pct, setPct] = useState(10);

  const add = () => {
    if (!code.trim()) return;
    createCoupon({ code: code.trim(), discountPct: pct, expiresAt: null });
    setCode("");
    setPct(10);
    setOpen(false);
  };

  return (
    <Panel
      title="Coupons"
      right={
        <button
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110"
        >
          <Plus className="h-3.5 w-3.5" /> New coupon
        </button>
      }
    >
      {open && (
        <div className="mb-4 grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 sm:grid-cols-[1fr_120px_auto]">
          <Field label="Code">
            <TextInput
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SUMMER25"
            />
          </Field>
          <Field label="Discount %">
            <NumberInput value={pct} min={1} max={100} onValue={(v) => setPct(v ?? 10)} />
          </Field>
          <div className="flex items-end">
            <button
              onClick={add}
              disabled={!code.trim()}
              className="h-[42px] rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {coupons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-400">
          <Ticket className="mx-auto mb-2 h-6 w-6 text-zinc-300" />
          No coupons yet.
        </div>
      ) : (
        <div className="space-y-2">
          {coupons.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-100 text-zinc-500">
                  <Ticket className="h-3.5 w-3.5" />
                </span>
                <div>
                  <div className="font-mono text-sm font-medium text-zinc-900">{c.code}</div>
                  <div className="text-xs text-zinc-400">
                    {c.discountPct}% off · created {formatDate(c.createdAt)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleCoupon(c.id)}
                  className={cx(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition",
                    c.active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200",
                  )}
                >
                  {c.active ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete coupon ${c.code}?`)) deleteCoupon(c.id);
                  }}
                  aria-label={`Delete ${c.code}`}
                  className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

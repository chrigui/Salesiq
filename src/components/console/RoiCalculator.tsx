"use client";

import { useState } from "react";
import { Calculator, TrendingUp, Clock, DollarSign, Info } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { Field, NumberInput } from "@/components/console/builder/fields";
import { formatMoney } from "@/core/engine/explain";

const DEFAULTS = {
  monthlyLeads: 50,
  closeRate: 20,
  avgDealSize: 15000,
  teamSize: 5,
  cycleLength: 45,
  hoursPerProposal: 3,
  closeRateLift: 15,
  proposalTimeReduction: 70,
  monthlyCost: 0,
};

function Num({
  label,
  hint,
  value,
  onValue,
  suffix,
}: {
  label: string;
  hint?: string;
  value: number | undefined;
  onValue: (n: number | undefined) => void;
  suffix?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <NumberInput value={value} onValue={onValue} min={0} />
        {suffix && <span className="shrink-0 text-xs text-ink-faint">{suffix}</span>}
      </div>
    </Field>
  );
}

/**
 * ROI Calculator (roadmap P1) — a real pre-sales tool, not a decorative
 * widget. Every output is a transparent, deterministic formula over the
 * inputs shown, with the improvement assumptions themselves exposed and
 * editable rather than buried as hidden magic numbers — the same
 * "explainable, nothing invented" standard the rest of the platform holds
 * its AI to.
 */
export function RoiCalculator() {
  const [v, setV] = useState(DEFAULTS);
  const set = (key: keyof typeof DEFAULTS) => (n: number | undefined) =>
    setV((s) => ({ ...s, [key]: n ?? 0 }));

  const currentMonthlyDeals = v.monthlyLeads * (v.closeRate / 100);
  const additionalMonthlyDeals = currentMonthlyDeals * (v.closeRateLift / 100);
  const additionalMonthlyRevenue = additionalMonthlyDeals * v.avgDealSize;
  const additionalAnnualRevenue = additionalMonthlyRevenue * 12;
  const hoursSavedPerMonth = v.monthlyLeads * v.hoursPerProposal * (v.proposalTimeReduction / 100);
  const annualHoursSaved = hoursSavedPerMonth * 12;
  const annualCost = v.monthlyCost * 12;
  const roiPct = annualCost > 0 ? Math.round(((additionalAnnualRevenue - annualCost) / annualCost) * 100) : null;
  const paybackMonths =
    v.monthlyCost > 0 && additionalMonthlyRevenue > 0 ? v.monthlyCost / additionalMonthlyRevenue : null;

  return (
    <div className="space-y-4">
      <Panel title="Your business today">
        <div className="grid gap-4 sm:grid-cols-3">
          <Num label="Monthly leads" value={v.monthlyLeads} onValue={set("monthlyLeads")} />
          <Num label="Current close rate" value={v.closeRate} onValue={set("closeRate")} suffix="%" />
          <Num label="Average deal size" value={v.avgDealSize} onValue={set("avgDealSize")} suffix="$" />
          <Num label="Sales team size" value={v.teamSize} onValue={set("teamSize")} suffix="reps" />
          <Num label="Average sales cycle" value={v.cycleLength} onValue={set("cycleLength")} suffix="days" />
          <Num label="Hours per proposal today" value={v.hoursPerProposal} onValue={set("hoursPerProposal")} suffix="hrs" />
        </div>
      </Panel>

      <Panel title="Assumptions">
        <p className="mb-4 flex items-start gap-2 text-xs text-ink-faint">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Editable, not hidden — every number below feeds directly into the
          outputs, so you can pressure-test them instead of taking them on
          faith.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Num
            label="Close-rate lift from guided selling"
            hint="Relative improvement, not additive"
            value={v.closeRateLift}
            onValue={set("closeRateLift")}
            suffix="%"
          />
          <Num
            label="Proposal time reduction"
            hint="AI-drafted vs. manual"
            value={v.proposalTimeReduction}
            onValue={set("proposalTimeReduction")}
            suffix="%"
          />
          <Num
            label="Estimated monthly cost"
            hint="Leave at 0 to skip payback"
            value={v.monthlyCost}
            onValue={set("monthlyCost")}
            suffix="$"
          />
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            <DollarSign className="h-3.5 w-3.5" /> Additional annual revenue
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-zinc-900">
            {formatMoney(additionalAnnualRevenue, "USD")}
          </div>
          <div className="text-xs text-zinc-400">
            {additionalMonthlyDeals.toFixed(1)} extra deals / month
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            <Clock className="h-3.5 w-3.5" /> Hours saved annually
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-zinc-900">
            {Math.round(annualHoursSaved).toLocaleString()}
          </div>
          <div className="text-xs text-zinc-400">
            {hoursSavedPerMonth.toFixed(1)} hrs / month across the team
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            <TrendingUp className="h-3.5 w-3.5" /> Estimated ROI
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-zinc-900">
            {roiPct != null ? `${roiPct}%` : "—"}
          </div>
          <div className="text-xs text-zinc-400">
            {roiPct != null ? "vs. annual cost entered above" : "enter a monthly cost to compute"}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            <Calculator className="h-3.5 w-3.5" /> Payback period
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-zinc-900">
            {paybackMonths != null ? `${paybackMonths.toFixed(1)} mo` : "—"}
          </div>
          <div className="text-xs text-zinc-400">
            {paybackMonths != null ? "time to break even" : "enter a monthly cost to compute"}
          </div>
        </div>
      </div>

      <Panel title="How this is calculated">
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-ink-muted">
          <li>Current monthly deals = monthly leads × close rate.</li>
          <li>Additional monthly deals = current deals × close-rate lift.</li>
          <li>Additional revenue = additional deals × average deal size, annualized ×12.</li>
          <li>Hours saved = monthly leads × hours per proposal × proposal time reduction, annualized ×12.</li>
          <li>ROI = (additional annual revenue − annual cost) ÷ annual cost.</li>
          <li>Payback = monthly cost ÷ additional monthly revenue.</li>
        </ol>
      </Panel>
    </div>
  );
}

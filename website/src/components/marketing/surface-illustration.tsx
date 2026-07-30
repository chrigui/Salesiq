import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Stylized, abstract illustrations of each product surface — deliberately
 * not screenshots. Real screenshots of the product would need to be
 * captured and kept in sync with the actual UI; these are compositional
 * stand-ins that communicate what each surface does, built from the same
 * design tokens as the rest of the site.
 */

function Chrome({
  children,
  variant,
  className,
}: {
  children: React.ReactNode;
  variant: "phone" | "browser";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-line bg-surface shadow-card",
        variant === "phone" ? "aspect-[9/17] w-full max-w-[240px]" : "aspect-[16/10] w-full",
        className,
      )}
    >
      {variant === "browser" && (
        <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
          <span className="h-2 w-2 rounded-full bg-line" />
          <span className="h-2 w-2 rounded-full bg-line" />
          <span className="h-2 w-2 rounded-full bg-line" />
        </div>
      )}
      {variant === "phone" && (
        <div className="flex justify-center py-2">
          <span className="h-1 w-10 rounded-full bg-line" />
        </div>
      )}
      <div className="h-full p-4">{children}</div>
    </div>
  );
}

export function CompanionIllustration() {
  return (
    <Chrome variant="phone">
      <div className="flex h-full flex-col gap-3">
        <div className="flex gap-1">
          {[1, 1, 1, 0].map((filled, i) => (
            <span key={i} className={cn("h-1 flex-1 rounded-full", filled ? "bg-accent" : "bg-surface-2")} />
          ))}
        </div>
        <p className="text-[10px] font-medium text-ink-muted">What matters most to you?</p>
        <div className="flex flex-col gap-1.5">
          {["Move-in timeline", "Budget range", "Dedicated office"].map((label) => (
            <div key={label} className="rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-[10px] text-ink">
              {label}
            </div>
          ))}
        </div>
        <div className="mt-auto rounded-lg bg-accent-ink px-3 py-2 text-center text-[10px] font-medium text-white">
          Continue
        </div>
      </div>
    </Chrome>
  );
}

export function DisplayIllustration() {
  return (
    <Chrome variant="browser">
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <span className="rounded-full bg-good-wash px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-accent-ink">
          Top match — 94
        </span>
        <div className="h-16 w-full max-w-[180px] rounded-lg bg-surface-2" />
        <p className="text-[11px] font-medium text-ink">Harbor Point Residence</p>
        <div className="flex flex-col gap-1 text-left">
          {["Within budget", "Dedicated office", "Ready in 45 days"].map((r) => (
            <div key={r} className="flex items-center gap-1.5 text-[9.5px] text-ink-muted">
              <CheckCircle2 className="h-2.5 w-2.5 text-good" aria-hidden="true" />
              {r}
            </div>
          ))}
        </div>
      </div>
    </Chrome>
  );
}

export function EngineIllustration() {
  const rows = [94, 71, 52];
  return (
    <Chrome variant="browser">
      <div className="flex h-full flex-col justify-center gap-3">
        {rows.map((score) => (
          <div key={score}>
            <div className="mb-1 flex justify-between text-[9.5px] text-ink-muted">
              <span>Option {rows.indexOf(score) + 1}</span>
              <span className="tabular-nums">{score}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-accent" style={{ width: `${score}%` }} />
            </div>
          </div>
        ))}
        <p className="mt-2 text-[9.5px] text-ink-muted">Every score traces back to a stated reason.</p>
      </div>
    </Chrome>
  );
}

export function DashboardIllustration() {
  const bars = [40, 65, 50, 80, 60, 92];
  return (
    <Chrome variant="browser">
      <div className="flex h-full flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-line bg-surface-2 p-2">
            <p className="text-[8.5px] text-ink-muted">Pipeline</p>
            <p className="text-[13px] font-semibold text-ink">$4.2M</p>
          </div>
          <div className="rounded-lg border border-line bg-surface-2 p-2">
            <p className="text-[8.5px] text-ink-muted">Win rate</p>
            <p className="text-[13px] font-semibold text-ink">38%</p>
          </div>
        </div>
        <div className="flex flex-1 items-end gap-1.5 rounded-lg border border-line bg-surface-2 p-2.5">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t-sm bg-accent" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </Chrome>
  );
}

export function AdminIllustration() {
  const rows = [
    { label: "Owner", on: true },
    { label: "Manager", on: true },
    { label: "Salesperson", on: false },
  ];
  return (
    <Chrome variant="browser">
      <div className="flex h-full flex-col gap-2.5">
        <p className="text-[9.5px] font-medium text-ink-muted">Permissions — Leads: Edit</p>
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-2.5 py-2">
            <span className="text-[10px] text-ink">{r.label}</span>
            <span className={cn("h-4 w-7 rounded-full", r.on ? "bg-accent" : "bg-line")}>
              <span className={cn("block h-3 w-3 translate-y-0.5 rounded-full bg-white transition-transform", r.on ? "translate-x-3.5" : "translate-x-0.5")} />
            </span>
          </div>
        ))}
      </div>
    </Chrome>
  );
}

"use client";

import { FlaskConical, SlidersHorizontal } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";
import { toggleFlag, useFeatureFlags } from "@/core/data/featureFlags";

/**
 * Feature Flags (Module 5). Real capabilities already shipping in SalesIQ,
 * toggleable platform-wide. Flipping one writes a real entry to the Audit
 * Logs tab — this isn't a mockup switchboard.
 */
export function FeatureFlags() {
  const flags = useFeatureFlags();

  return (
    <div className="space-y-4">
      <Panel title="Feature flags">
        <p className="mb-4 text-sm text-zinc-500">
          Enable or disable platform capabilities. Every change is recorded
          in the audit log.
        </p>
        <div className="space-y-2">
          {flags.map((flag) => (
            <div
              key={flag.id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-500">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900">{flag.label}</span>
                    {flag.beta && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                        <FlaskConical className="h-2.5 w-2.5" /> Beta
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">{flag.description}</p>
                </div>
              </div>
              <button
                onClick={() => toggleFlag(flag.id)}
                aria-label={`${flag.enabled ? "Disable" : "Enable"} ${flag.label}`}
                className={cx(
                  "relative h-6 w-11 shrink-0 rounded-full transition",
                  flag.enabled ? "bg-zinc-900" : "bg-zinc-200",
                )}
              >
                <span
                  className={cx(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    flag.enabled ? "translate-x-5" : "translate-x-0.5",
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

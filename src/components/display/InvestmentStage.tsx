"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import type { DisplayWidgetContext } from "./types";
import { DisplayPriceSummary } from "./widgets/DisplayPriceSummary";
import { DisplayInvestment } from "./widgets/DisplayInvestment";
import { DisplayAvailability } from "./widgets/DisplayAvailability";

const spring = { type: "spring", stiffness: 260, damping: 30 } as const;

/**
 * Spec section 13: only ever verified metrics from the database — price,
 * appreciation, availability — composed from Display Studio's existing
 * widgets. Rental yield/growth/demand/market-forecast have no real field
 * anywhere in the schema, so they always read "Data not available" rather
 * than being silently omitted — the point of a dedicated Investment screen
 * is to answer those questions honestly, not to look empty.
 */
export function InvestmentStage({ context }: { context: DisplayWidgetContext }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={spring}
      className="w-full max-w-3xl"
    >
      <div className="mb-6 flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <TrendingUp className="h-6 w-6 text-brand" />
        Investment
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DisplayPriceSummary {...context} />
        <DisplayAvailability {...context} />
      </div>
      <DisplayInvestment {...context} />
      <div className="mx-auto mt-4 max-w-3xl space-y-2 px-6 sm:px-10">
        {["Rental yield", "Growth forecast", "Demand"].map((label) => (
          <div key={label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm">
            <span className="text-ink-muted">{label}</span>
            <span className="text-ink-faint">Data not available</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

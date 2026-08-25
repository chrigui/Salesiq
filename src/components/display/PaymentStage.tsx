"use client";

import { motion } from "framer-motion";
import { Wallet } from "lucide-react";
import type { DisplayWidgetContext } from "./types";
import { DisplayPriceSummary } from "./widgets/DisplayPriceSummary";
import { DisplayDocuments } from "./widgets/DisplayDocuments";

const spring = { type: "spring", stiffness: 260, damping: 30 } as const;

/**
 * Spec section 17: property price + payment structure, using only verified
 * data. Never called a "proposal," no legal language. The database has no
 * structured deposit/installments/balance/handover fields anywhere — only
 * uploaded documents — so those four lines always read "Data not
 * available" rather than a fabricated breakdown, while real uploaded
 * payment/floor-plan documents (DisplayDocuments) are shown as-is.
 */
export function PaymentStage({ context }: { context: DisplayWidgetContext }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={spring}
      className="w-full max-w-3xl"
    >
      <div className="mb-6 flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <Wallet className="h-6 w-6 text-brand" />
        Payment
      </div>
      <DisplayPriceSummary {...context} />
      <div className="mt-4 space-y-2">
        {["Initial payment", "Installments", "Balance", "Handover"].map((label) => (
          <div key={label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm">
            <span className="text-ink-muted">{label}</span>
            <span className="text-ink-faint">Data not available</span>
          </div>
        ))}
      </div>
      <DisplayDocuments {...context} />
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Compass,
  Boxes,
  ListChecks,
  Sparkles,
  UserPlus,
  BarChart3,
} from "lucide-react";
import { cx } from "@/components/ui/primitives";

const STEPS = [
  {
    icon: Boxes,
    title: "Industries",
    body: "Every vertical — real estate, yachts, private jets, whatever you sell — is an industry pack. Ship one, or build your own without code.",
  },
  {
    icon: ListChecks,
    title: "Questions & Scoring",
    body: "Design the guided flow your customer answers, then set scoring rules so the engine ranks inventory by fit — not just price.",
  },
  {
    icon: Sparkles,
    title: "Smart Wizard",
    body: "Describe a business in a sentence and the wizard generates a full working pack — questions, inventory and rules — in seconds.",
  },
  {
    icon: UserPlus,
    title: "Leads & Follow-up",
    body: "Every saved session becomes a lead with a real match score. Assign it, schedule a follow-up, and draft an AI follow-up email.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    body: "Funnel, AI confidence, product heatmaps and customer journeys — see what's converting and where people drop off.",
  },
];

const KEY = "salesiq-tour-completed";

export function hasTakenTour(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) === "1";
}

function markTourDone(): void {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* storage unavailable */
  }
}

/** Guided Tutorials / Product Tours (Module 11). A short walkthrough of the
 * five things a new tenant most needs to understand, self-paced. */
export function ProductTour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);

  const close = () => {
    markTourDone();
    setStep(0);
    onClose();
  };

  const current = STEPS[step];
  const Icon = current.icon;
  const last = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <Compass className="h-3.5 w-3.5" /> Step {step + 1} of {STEPS.length}
              </div>
              <button onClick={close} className="grid h-7 w-7 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-zinc-900 text-white">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900">{current.title}</h3>
            <p className="mt-1.5 text-sm text-zinc-500">{current.body}</p>

            <div className="mt-5 flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <span key={i} className={cx("h-1.5 flex-1 rounded-full", i <= step ? "bg-zinc-900" : "bg-zinc-100")} />
              ))}
            </div>

            <div className="mt-5 flex justify-between gap-2">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-40"
              >
                Back
              </button>
              <button
                onClick={() => (last ? close() : setStep((s) => s + 1))}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                {last ? "Done" : "Next"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

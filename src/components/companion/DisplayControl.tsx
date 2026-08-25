"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Tv,
  ScreenShare,
  GitCompareArrows,
  Sparkles,
  TrendingUp,
  LandPlot,
  MapPin,
  Wallet,
  Trophy,
} from "lucide-react";
import { useSession, type DisplayView } from "@/core/store/session";
import type { ScoredItem } from "@/core/engine/scoring";

interface ControlAction {
  label: string;
  icon: typeof ScreenShare;
  view: DisplayView | "compareGroup";
}

const ACTIONS: ControlAction[] = [
  { label: "Show this property", icon: ScreenShare, view: "item" },
  { label: "Show comparison", icon: GitCompareArrows, view: "compareGroup" },
  { label: "Show why", icon: Sparkles, view: "whyThis" },
  { label: "Show investment", icon: TrendingUp, view: "investment" },
  { label: "Show floor plan", icon: LandPlot, view: "floorPlan" },
  { label: "Show location", icon: MapPin, view: "location" },
  { label: "Show payment", icon: Wallet, view: "payment" },
  { label: "Show recommendation", icon: Trophy, view: "recommendation" },
];

/**
 * Spec section 11: a small contextual control, never all 8 actions exposed
 * in the main UI simultaneously — it opens as a bottom sheet for whichever
 * property the salesperson tapped "Display" on, and every action routes
 * through the single presentItem() atomic action (or setView for the
 * item-agnostic "Show comparison") so the Display never flashes through an
 * intermediate view.
 */
export function DisplayControl({ item, onClose }: { item: ScoredItem; onClose: () => void }) {
  const session = useSession();

  const trigger = (view: ControlAction["view"]) => {
    if (view === "compareGroup") {
      session.setView("compareGroup");
    } else {
      session.presentItem(item.item.id, view);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="glass-strong w-full max-w-sm rounded-t-3xl p-5 sm:rounded-3xl"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tv className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-semibold text-ink">Display · {item.item.name}</h3>
            </div>
            <button
              onClick={onClose}
              className="grid h-7 w-7 place-items-center rounded-full bg-white/5 text-ink-muted hover:bg-white/10"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {ACTIONS.map(({ label, icon: Icon, view }) => (
              <button
                key={label}
                onClick={() => trigger(view)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left text-xs font-medium text-ink-muted transition hover:bg-white/10"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-brand" />
                {label}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

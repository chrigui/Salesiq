"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Tv,
  ChevronDown,
  ScreenShare,
  GitCompareArrows,
  Sparkles,
  Ban,
  Trophy,
  Palmtree,
  TrendingUp,
  LandPlot,
  MapPin,
  Wallet,
} from "lucide-react";
import { useSession, type DisplayView } from "@/core/store/session";
import type { ScoredItem } from "@/core/engine/scoring";
import { cx } from "@/components/ui/primitives";

interface ControlAction {
  label: string;
  icon: typeof ScreenShare;
  view: DisplayView | "compareGroup";
}

/**
 * Grouped by intent rather than one flat list: what to show about THIS
 * property, how it stacks up against the others being compared, and the
 * five Decision-Room "deep dive" modes — kept in their own collapsible
 * section since a salesperson reaches for them far less often than the
 * first two groups, and 10 equal-weight buttons made all of them equally
 * hard to scan.
 */
const PROPERTY_ACTIONS: ControlAction[] = [
  { label: "Show this property", icon: ScreenShare, view: "item" },
  { label: "Show why", icon: Sparkles, view: "whyThis" },
  { label: "Show why not", icon: Ban, view: "whyNot" },
];

const COMPARISON_ACTIONS: ControlAction[] = [
  { label: "Show comparison", icon: GitCompareArrows, view: "compareGroup" },
  { label: "Show recommendation", icon: Trophy, view: "recommendation" },
];

const DEEP_DIVE_ACTIONS: ControlAction[] = [
  { label: "Lifestyle", icon: Palmtree, view: "lifestyle" },
  { label: "Investment", icon: TrendingUp, view: "investment" },
  { label: "Floor plan", icon: LandPlot, view: "floorPlan" },
  { label: "Location", icon: MapPin, view: "location" },
  { label: "Payment", icon: Wallet, view: "payment" },
];

/**
 * A small contextual control, never every action exposed in the main UI
 * simultaneously — it opens as a bottom sheet for whichever property the
 * salesperson tapped "Display" on, and every action routes through the
 * single presentItem() atomic action (or setView for the item-agnostic
 * "Show comparison") so the Display never flashes through an intermediate
 * view. The currently-live view is highlighted so the salesperson can tell
 * at a glance what the customer is looking at right now.
 *
 * Deliberately does NOT surface "compare"/"proposal"/"recap" — those are
 * whole-session actions with their own dedicated, already-visible entry
 * points (the classic workspace's Action Bar, and Decision Room's own
 * "Create LUMMA Recap" button) rather than per-item pushes; folding them in
 * here would conflate "what does this property look like" with "what stage
 * of the meeting are we in."
 */
export function DisplayControl({ item, onClose }: { item: ScoredItem; onClose: () => void }) {
  const session = useSession();
  const [deepDiveOpen, setDeepDiveOpen] = useState(
    DEEP_DIVE_ACTIONS.some((a) => a.view === session.view),
  );

  const isActive = (view: ControlAction["view"]) =>
    view === "compareGroup"
      ? session.view === "compareGroup"
      : session.view === view && session.focusedItemId === item.item.id;

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

          <ActionGroup label="This property" actions={PROPERTY_ACTIONS} isActive={isActive} onTrigger={trigger} />
          <ActionGroup label="Comparison" actions={COMPARISON_ACTIONS} isActive={isActive} onTrigger={trigger} />

          <div className="mt-3">
            <button
              onClick={() => setDeepDiveOpen((v) => !v)}
              className="flex w-full items-center justify-between px-0.5 py-1 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-faint"
            >
              Explore in depth
              <ChevronDown className={cx("h-3.5 w-3.5 transition-transform", deepDiveOpen && "rotate-180")} />
            </button>
            {deepDiveOpen && (
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {DEEP_DIVE_ACTIONS.map((action) => (
                  <ActionButton key={action.label} action={action} active={isActive(action.view)} onTrigger={trigger} />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ActionGroup({
  label,
  actions,
  isActive,
  onTrigger,
}: {
  label: string;
  actions: ControlAction[];
  isActive: (view: ControlAction["view"]) => boolean;
  onTrigger: (view: ControlAction["view"]) => void;
}) {
  return (
    <div className="mb-3">
      <div className="mb-1.5 px-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <ActionButton key={action.label} action={action} active={isActive(action.view)} onTrigger={onTrigger} />
        ))}
      </div>
    </div>
  );
}

function ActionButton({
  action: { label, icon: Icon, view },
  active,
  onTrigger,
}: {
  action: ControlAction;
  active: boolean;
  onTrigger: (view: ControlAction["view"]) => void;
}) {
  return (
    <button
      onClick={() => onTrigger(view)}
      className={cx(
        "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition",
        active
          ? "border-brand/40 bg-brand/15 text-ink"
          : "border-white/10 bg-white/5 text-ink-muted hover:bg-white/10",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-brand" />
      {label}
      {active && <Tv className="ml-auto h-3 w-3 shrink-0 text-brand" />}
    </button>
  );
}

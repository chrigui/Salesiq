"use client";

import { useRef } from "react";
import { motion, type PanInfo } from "framer-motion";
import type { IndustryPack } from "@/core/types";
import type { ScoredItem } from "@/core/engine/scoring";
import { PropertyCard } from "./PropertyCard";

/**
 * Wraps PropertyCard with a real drag gesture (framer-motion's native
 * `drag`, already a dependency — no new library). Dragging one card onto
 * another is detected by the parent grid via a simple bounding-rect
 * hit-test on drop, not a dedicated DnD collision engine — the grid is
 * small enough (a couple dozen cards at most) that this is both simpler
 * and cheaper. Springs back to its slot when a drop doesn't land on
 * another card, so nothing is ever silently lost.
 */
export function DraggableCard({
  pack,
  scored,
  onSelect,
  registerRef,
  onDragEnd,
}: {
  pack: IndustryPack;
  scored: ScoredItem;
  onSelect: () => void;
  registerRef: (el: HTMLDivElement | null) => void;
  onDragEnd: (point: { x: number; y: number }) => void;
}) {
  // The card's `whileDrag` transform keeps it rendered on top of whatever
  // it's dropped onto, so the browser's native click (which fires whenever
  // mousedown/mouseup land on the same element) targets this card's own
  // button right after a successful drop — opening its own preview instead
  // of just completing the compare-add. Swallow exactly the one click that
  // immediately follows a drag; a plain tap (no onDragStart) still opens
  // the preview as normal.
  const draggedRef = useRef(false);

  const handleDragStart = () => {
    draggedRef.current = true;
  };

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    onDragEnd({ x: info.point.x - window.scrollX, y: info.point.y - window.scrollY });
    setTimeout(() => {
      draggedRef.current = false;
    }, 0);
  };

  const handleSelect = () => {
    if (draggedRef.current) return;
    onSelect();
  };

  return (
    <motion.div
      ref={registerRef}
      drag
      dragMomentum={false}
      dragElastic={0.12}
      whileDrag={{ scale: 1.04, zIndex: 20, boxShadow: "0 12px 32px rgba(0,0,0,0.35)" }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="touch-none"
    >
      <PropertyCard pack={pack} scored={scored} onSelect={handleSelect} />
    </motion.div>
  );
}

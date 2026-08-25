"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { DisplayWidgetContext } from "./types";
import { DisplayGallery } from "./widgets/DisplayGallery";
import { DisplayNeighborhood } from "./widgets/DisplayNeighborhood";
import { DisplayNearbyPlaces } from "./widgets/DisplayNearbyPlaces";

const spring = { type: "spring", stiffness: 260, damping: 30 } as const;

/**
 * Spec section 14: the emotional "can I see myself living here?" mode —
 * composed from Display Studio's existing gallery/neighborhood/nearby-places
 * widgets (real photos, real item.lifestyle data, real OpenStreetMap
 * amenities), never LifestyleMap.tsx (its InvestmentOutlook sub-widget
 * fabricates a rental yield). Deliberately not a bare "Data not available"
 * screen if everything is missing — a lifestyle-oriented listing with zero
 * lifestyle data is itself an honest fact worth saying plainly.
 */
export function LifestyleStage({ context }: { context: DisplayWidgetContext }) {
  const hasAnyContent =
    Boolean(context.item.photo || context.item.gallery?.length) ||
    Boolean(context.item.lifestyle) ||
    Boolean(context.item.nearbyAmenities?.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={spring}
      className="w-full max-w-5xl"
    >
      <div className="mb-2 flex items-center justify-center gap-2 text-2xl font-semibold tracking-tight">
        <Sparkles className="h-6 w-6 text-brand" />
        {context.item.name}
      </div>
      {!hasAnyContent && (
        <p className="mx-auto mt-8 max-w-md text-center text-sm text-ink-faint">
          No lifestyle details available for this property.
        </p>
      )}
      <DisplayGallery {...context} />
      <DisplayNeighborhood {...context} />
      <DisplayNearbyPlaces {...context} />
    </motion.div>
  );
}

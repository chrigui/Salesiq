"use client";

import { motion } from "framer-motion";
import { MapPin, Compass } from "lucide-react";
import type { DisplayWidgetContext } from "./types";
import { DisplayLocationMap } from "./widgets/DisplayLocationMap";
import { DisplayNearbyPlaces } from "./widgets/DisplayNearbyPlaces";
import { haversineMeters } from "@/lib/geoMath";
import { metersToMinutes } from "@/components/companion/discoveryScoring";

const spring = { type: "spring", stiffness: 260, damping: 30 } as const;

/**
 * Spec section 16: property + relevant real destinations, travel time where
 * possible. Composed from Display Studio's existing map/nearby-places
 * widgets (real item.location, real OpenStreetMap nearbyAmenities) plus the
 * same real workplace-distance calculation PropertyDetails.tsx already
 * does (haversineMeters + the shared metersToMinutes conversion) — never a
 * second distance formula.
 */
export function LocationStage({
  context,
  workLocationLat,
  workLocationLng,
}: {
  context: DisplayWidgetContext;
  workLocationLat: number | null;
  workLocationLng: number | null;
}) {
  const { item } = context;
  const workMinutes =
    workLocationLat != null && workLocationLng != null && item.location
      ? metersToMinutes(haversineMeters(workLocationLat, workLocationLng, item.location.lat, item.location.lng))
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={spring}
      className="w-full max-w-3xl"
    >
      <div className="mb-2 flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <MapPin className="h-6 w-6 text-brand" />
        {item.name}
      </div>
      {item.location?.label && <p className="mb-4 text-lg text-ink-muted">{item.location.label}</p>}

      {!item.location && (
        <p className="mt-8 text-sm text-ink-faint">No location set for this property.</p>
      )}

      <DisplayLocationMap {...context} />

      {workMinutes !== null && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm">
          <Compass className="h-4 w-4 text-brand" />
          ~{workMinutes} min from your stated workplace
        </div>
      )}

      <DisplayNearbyPlaces {...context} />
    </motion.div>
  );
}

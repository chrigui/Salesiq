import { School, HeartPulse, ShoppingCart, Trees, TrainFront, Utensils, MapPin } from "lucide-react";
import type { NearbyAmenity } from "@/core/types";
import type { DisplayWidgetContext } from "../types";

const KIND_ICON: Record<NearbyAmenity["kind"], typeof MapPin> = {
  school: School,
  hospital: HeartPulse,
  supermarket: ShoppingCart,
  park: Trees,
  transport: TrainFront,
  restaurant: Utensils,
  other: MapPin,
};

function formatDistance(m: number): string {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

/** Real nearby amenities from OpenStreetMap (item.nearbyAmenities) — never the hand-illustrated Lifestyle Map pois. */
export function DisplayNearbyPlaces({ item, mode }: DisplayWidgetContext) {
  const amenities = [...(item.nearbyAmenities ?? [])].sort((a, b) => a.distanceMeters - b.distanceMeters).slice(0, 5);

  if (amenities.length === 0) {
    if (mode === "preview") {
      return (
        <div className="rounded-2xl border border-dashed border-white/15 p-4 text-center">
          <p className="text-xs text-white/40">No nearby amenities found for this listing yet.</p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/50">Nearby places</div>
      <div className="space-y-2">
        {amenities.map((a, i) => {
          const Icon = KIND_ICON[a.kind];
          return (
            <div key={`${a.name}-${i}`} className="flex items-center gap-2 text-xs">
              <Icon className="h-3.5 w-3.5 shrink-0 text-brand" />
              <span className="flex-1 truncate text-white/80">{a.name}</span>
              <span className="shrink-0 text-white/50">{formatDistance(a.distanceMeters)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

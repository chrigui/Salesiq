import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import type { DisplayWidgetContext } from "../types";

// maplibre-gl touches `window` at import time, same reason LifestyleMap.tsx
// dynamically imports RealMap.
const DisplayLocationMapInner = dynamic(
  () => import("./DisplayLocationMapInner").then((m) => m.DisplayLocationMapInner),
  { ssr: false },
);

export function DisplayLocationMap({ item, mode }: DisplayWidgetContext) {
  if (!item.location) {
    if (mode === "preview") {
      return (
        <div className="grid h-40 place-items-center rounded-2xl border border-dashed border-white/15 text-center">
          <p className="px-4 text-xs text-white/40">No location set for this listing yet.</p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="h-36 w-full">
        <DisplayLocationMapInner item={item} />
      </div>
      <div className="flex items-center gap-1.5 p-3 text-xs text-white/70">
        <MapPin className="h-3.5 w-3.5 text-brand" />
        <span className="truncate">{item.location.label}</span>
      </div>
    </div>
  );
}

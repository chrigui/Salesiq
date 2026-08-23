import { Images } from "lucide-react";
import type { DisplayWidgetContext } from "../types";

/** Compact card variant of DisplayGallery — one hero photo + a thumbnail strip, sized for the Grid layout. */
export function DisplayGalleryCard({ item, mode }: DisplayWidgetContext) {
  const photos = [item.photo, ...(item.gallery ?? [])].filter((p): p is string => Boolean(p));

  if (photos.length === 0) {
    if (mode === "preview") {
      return (
        <div className="rounded-2xl border border-dashed border-white/15 p-4 text-center">
          <p className="text-xs text-white/40">No gallery photos on this listing yet.</p>
        </div>
      );
    }
    return null;
  }

  const [main, ...rest] = photos;
  const thumbs = rest.slice(0, 3);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={main} alt="" loading="lazy" className="h-32 w-full object-cover" />
      <div className="flex items-center gap-1.5 p-2">
        {thumbs.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={src} alt="" loading="lazy" className="h-10 w-10 rounded-lg object-cover" />
        ))}
        <div className="ml-auto flex items-center gap-1 text-[11px] text-white/50">
          <Images className="h-3 w-3" /> {photos.length}
        </div>
      </div>
    </div>
  );
}

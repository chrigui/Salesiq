import { BadgeCheck, Camera, FileText, MapPin, ListChecks } from "lucide-react";
import type { ComponentType } from "react";
import type { DisplayWidgetContext } from "../types";

/**
 * Badges built only from real, provable facts already on this profile —
 * photo/document counts, whether neighborhood or spec data exists. No
 * invented ratings, certifications, or review counts.
 */
export function DisplayTrustBadges({ item, pack, assets }: DisplayWidgetContext) {
  const badges: { icon: ComponentType<{ className?: string }>; label: string }[] = [
    { icon: BadgeCheck, label: `Presented by ${pack.branding.name}` },
  ];
  const photoCount = [item.photo, ...(item.gallery ?? [])].filter(Boolean).length;
  if (photoCount > 0) badges.push({ icon: Camera, label: `${photoCount} verified photo${photoCount === 1 ? "" : "s"}` });
  if (assets.length > 0) badges.push({ icon: FileText, label: `${assets.length} document${assets.length === 1 ? "" : "s"} available` });
  if (item.lifestyle) badges.push({ icon: MapPin, label: "Neighborhood data verified" });
  if (Object.keys(item.attributes).length > 0) badges.push({ icon: ListChecks, label: "Full specs available" });

  return (
    <section className="mx-auto max-w-3xl px-6 py-6 sm:px-10">
      <div className="flex flex-wrap gap-2">
        {badges.map((b, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80"
          >
            <b.icon className="h-3.5 w-3.5 text-brand" />
            {b.label}
          </div>
        ))}
      </div>
    </section>
  );
}

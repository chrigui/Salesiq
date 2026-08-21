import { ItemImage } from "@/components/ui/ItemImage";
import { formatMoney } from "@/core/engine/explain";
import { cx } from "@/components/ui/primitives";
import type { DisplayWidgetContext } from "../types";

export function DisplayHero({ item, pack, template, motion }: DisplayWidgetContext) {
  return (
    <section className="relative">
      <ItemImage
        image={item.image}
        photo={item.photo}
        className="h-[52vh] min-h-[320px] w-full"
        zoom={motion.reduceMotion ? undefined : motion.imageZoom}
        zoomDurationMs={motion.transition.durationMs * 6}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
          <div className="mb-3 flex items-center gap-2 text-white/90">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/15 text-lg backdrop-blur">
              {pack.branding.logoGlyph}
            </span>
            <span className="text-sm font-medium">{pack.branding.name}</span>
          </div>
          <h1
            className={cx(
              "max-w-2xl text-white",
              template === "LuxuryCinematic"
                ? "font-serif text-4xl font-medium tracking-tight sm:text-6xl"
                : template === "Minimal"
                  ? "text-2xl font-medium tracking-tight sm:text-4xl"
                  : "text-3xl font-semibold tracking-tight sm:text-5xl",
            )}
          >
            {item.name}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/80 sm:text-base">{item.subtitle}</p>
          <div className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
            {formatMoney(item.price, item.currency)}
          </div>
        </div>
      </ItemImage>
      {/* Video hero is not yet available — cinematic templates fall back to the photo above until a hosted-video option ships. */}
    </section>
  );
}

import type { BrochureWidgetContext } from "../types";

export function Gallery({ item, dark }: BrochureWidgetContext) {
  const photos = [item.photo, ...(item.gallery ?? [])].filter((p): p is string => Boolean(p));
  if (photos.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
      <h2 className={dark ? "mb-4 text-lg font-semibold text-white" : "mb-4 text-lg font-semibold text-zinc-900"}>
        Gallery
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photos.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt=""
            loading="lazy"
            className="aspect-[4/3] w-full rounded-xl object-cover"
          />
        ))}
      </div>
    </section>
  );
}

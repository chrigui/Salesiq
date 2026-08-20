import type { DisplayWidgetContext } from "../types";

export function DisplayGallery({ item, mode }: DisplayWidgetContext) {
  const photos = [item.photo, ...(item.gallery ?? [])].filter((p): p is string => Boolean(p));

  if (photos.length === 0) {
    return mode === "preview" ? (
      <section className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
        <h2 className="mb-4 text-lg font-semibold text-white">Gallery</h2>
        <p className="rounded-2xl border border-dashed border-white/15 px-6 py-10 text-center text-sm text-white/40">
          No gallery photos on this listing yet.
        </p>
      </section>
    ) : null;
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
      <h2 className="mb-4 text-lg font-semibold text-white">Gallery</h2>
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

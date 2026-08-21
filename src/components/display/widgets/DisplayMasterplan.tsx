import type { DisplayWidgetContext } from "../types";

const IMAGE_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

/**
 * Shows the first uploaded image asset as a full-bleed masterplan/site-plan
 * view — real uploaded content, not a fabricated site diagram. No image
 * asset uploaded yet -> an honest empty state, never a placeholder graphic
 * standing in for real masterplan data this tenant hasn't provided.
 */
export function DisplayMasterplan({ assets, assetsBaseUrl, mode }: DisplayWidgetContext) {
  const image = assets.find((a) => IMAGE_MIME.has(a.mimeType));

  if (!image) {
    if (mode === "preview") {
      return (
        <section className="mx-auto max-w-3xl px-6 py-10 text-center sm:px-10">
          <p className="text-sm text-white/40">
            No masterplan image uploaded yet — add one from this profile&apos;s Documents.
          </p>
        </section>
      );
    }
    return null;
  }

  return (
    <section className="px-6 py-10 sm:px-10">
      <h2 className="mb-4 text-lg font-semibold text-white">Masterplan</h2>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${assetsBaseUrl}/${image.id}`}
        alt={image.name}
        loading="lazy"
        className="w-full rounded-xl border border-white/10 object-contain"
      />
    </section>
  );
}

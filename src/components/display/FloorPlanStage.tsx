"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LandPlot, ZoomIn, ZoomOut } from "lucide-react";
import type { DisplayWidgetContext } from "./types";

const spring = { type: "spring", stiffness: 260, damping: 30 } as const;
const IMAGE_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

/**
 * Spec section 15: a large interactive floor plan the customer's eye goes
 * to first. Generalizes DisplayMasterplan's "first uploaded image asset"
 * pattern to *every* real uploaded image, presented as a filmstrip a
 * salesperson can step through — an honest stand-in for "switch floor/unit"
 * given the database has no distinct floor/unit model, only whichever
 * images a tenant uploaded (documented here, not silently implied to be
 * something more structured than it is). Dimensions/balcony/view aren't
 * captured anywhere either, so they read "Data not available" rather than
 * being guessed from the image.
 */
export function FloorPlanStage({ context }: { context: DisplayWidgetContext }) {
  const images = context.assets.filter((a) => IMAGE_MIME.has(a.mimeType));
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const current = images[index];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={spring}
      className="w-full max-w-4xl"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <LandPlot className="h-6 w-6 text-brand" />
          Floor plan
        </div>
        {current && (
          <button
            onClick={() => setZoomed((z) => !z)}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-white/10"
          >
            {zoomed ? <ZoomOut className="h-3.5 w-3.5" /> : <ZoomIn className="h-3.5 w-3.5" />}
            {zoomed ? "Zoom out" : "Zoom in"}
          </button>
        )}
      </div>

      {!current ? (
        <p className="text-sm text-ink-faint">No floor plan uploaded for this property.</p>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            <AnimatePresence mode="wait">
              <motion.img
                key={current.id}
                src={`${context.assetsBaseUrl}/${current.id}`}
                alt="Floor plan"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, scale: zoomed ? 1.6 : 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="h-[60vh] w-full object-contain"
              />
            </AnimatePresence>
          </div>

          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => {
                    setIndex(i);
                    setZoomed(false);
                  }}
                  aria-label={`Switch to ${img.name}`}
                  className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                    i === index ? "ring-brand" : "opacity-60 ring-transparent hover:opacity-90"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${context.assetsBaseUrl}/${img.id}`}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Dimensions", value: null },
              { label: "Balcony / terrace", value: null },
              {
                label: "View",
                value: typeof context.item.attributes.view === "string" ? context.item.attributes.view : null,
              },
              { label: "Unit", value: null },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-xs">
                <div className="text-ink-faint">{label}</div>
                <div className="mt-0.5 text-ink-muted">{value ?? "Data not available"}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}

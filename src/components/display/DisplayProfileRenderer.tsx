"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { WIDGET_REGISTRY } from "./registry";
import type { DisplayPackSummary, DisplayWidgetContext } from "./types";
import type { DisplayProfileDTO } from "@/lib/serializers/displayProfile";
import type { IndustryPack, InventoryItem } from "@/core/types";
import { resolveMotionConfig } from "@/core/display/motionPresets";
import { nearestComparables } from "@/lib/comparables";
import { BrandTokenScope } from "./BrandTokenScope";

export interface DisplayProfileRendererProps {
  profile: DisplayProfileDTO;
  pack: IndustryPack;
  item: InventoryItem;
  mode: DisplayWidgetContext["mode"];
  /** Forwarded from DisplayStage's own claimed-device state — absent in the editor preview, where there's no real kiosk to attribute a lead submission to. */
  deviceId?: string;
  deviceToken?: string;
  /** Forwarded from DisplayStage's own live scoreInventory()/narrate() run — absent (idle mode, editor preview) when there's no active customer session to score against. */
  matchScore?: DisplayWidgetContext["matchScore"];
  /** Forwarded from DisplayStage's own shared session state — absent (idle mode, editor preview) outside a live session. */
  sessionView?: DisplayWidgetContext["sessionView"];
  hasProposal?: boolean;
}

/**
 * Renders a Display Profile's enabled widget composition — shared by the
 * Display Studio editor's live preview and the real Customer Display, so
 * "what you configure is what the customer sees" is a structural guarantee,
 * not a promise the two surfaces could quietly drift apart on. Mirrors
 * src/components/brochure/BrochureView.tsx's scoped --brand/--brand-soft
 * pattern so a profile's brand overrides don't touch the app-wide theme.
 */
export function DisplayProfileRenderer({ profile, pack, item, mode, deviceId, deviceToken, matchScore, sessionView, hasProposal }: DisplayProfileRendererProps) {
  const brand = profile.brandOverrides?.brand || profile.resolvedBrandProfile?.brand || pack.branding.brand;
  const brandSoft = profile.brandOverrides?.brandSoft || profile.resolvedBrandProfile?.brandSoft || pack.branding.brandSoft;
  const resolvedBrand = profile.resolvedBrandProfile;
  const logoUrl =
    resolvedBrand?.id && resolvedBrand.logoMimeType ? `/api/public/brand-profiles/${resolvedBrand.id}/logo` : null;

  const packSummary: DisplayPackSummary = {
    id: pack.id,
    label: pack.label,
    vertical: pack.vertical,
    currency: item.currency,
    branding: {
      name: pack.branding.name,
      tagline: pack.branding.tagline,
      brand,
      brandSoft,
      logoGlyph: pack.branding.logoGlyph,
      logoUrl,
    },
  };

  const enabled = profile.sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);

  if (enabled.length === 0) {
    return (
      <BrandTokenScope brand={{ brand, brandSoft, fontHeading: resolvedBrand?.fontHeading, fontBody: resolvedBrand?.fontBody }} className="grid min-h-[50vh] place-items-center bg-zinc-950">
        <p className="text-sm text-white/40">No widgets enabled for this profile yet.</p>
      </BrandTokenScope>
    );
  }

  const assetsBaseUrl = `/api/public/display-profiles/${profile.id}/assets`;
  const motionConfig = resolveMotionConfig(profile.motion);
  const comparables = nearestComparables(pack.inventory, item);

  const widgets = enabled.map((s, i) => {
    const Widget = WIDGET_REGISTRY[s.type];
    if (!Widget) return null;
    const widget = (
      <Widget
        item={item}
        pack={packSummary}
        template={profile.template}
        mode={mode}
        assets={profile.assets}
        assetsBaseUrl={assetsBaseUrl}
        motion={motionConfig}
        comparables={comparables}
        deviceId={deviceId}
        deviceToken={deviceToken}
        matchScore={matchScore ?? null}
        sessionView={sessionView}
        hasProposal={hasProposal}
      />
    );
    if (motionConfig.reduceMotion) {
      return { id: s.id, span: sectionSpan(s), node: <div key={s.id}>{widget}</div> };
    }
    return {
      id: s.id,
      span: sectionSpan(s),
      node: (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, y: motionConfig.reveal.distancePx }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{
            duration: motionConfig.reveal.durationMs / 1000,
            delay: (i * motionConfig.reveal.staggerMs) / 1000,
            ease: motionConfig.transition.ease,
          }}
        >
          {widget}
        </motion.div>
      ),
    };
  });

  if (profile.layout === "Grid") {
    return (
      <BrandTokenScope brand={{ brand, brandSoft, fontHeading: resolvedBrand?.fontHeading, fontBody: resolvedBrand?.fontBody }} className="min-h-screen bg-zinc-950 p-6">
        <div className="grid grid-cols-4 gap-4">
          {widgets.map((w) =>
            w ? (
              <GridCell key={w.id} span={w.span}>
                {w.node}
              </GridCell>
            ) : null,
          )}
        </div>
      </BrandTokenScope>
    );
  }

  return (
    <BrandTokenScope brand={{ brand, brandSoft, fontHeading: resolvedBrand?.fontHeading, fontBody: resolvedBrand?.fontBody }} className="min-h-screen bg-zinc-950">
      {widgets.map((w) => (w ? w.node : null))}
    </BrandTokenScope>
  );
}

/**
 * A widget with no supporting data renders null (honest, never fabricated —
 * see every widget's empty-state handling) rather than a placeholder, but a
 * plain grid-span div around `null` still reserves its column span, leaving
 * a visible gap and pushing every later widget out of alignment. Measuring
 * after mount and collapsing to nothing (not just visually hidden — removed
 * from grid flow) is the general fix that works for any widget, current or
 * future, without the renderer needing to know per-type why something is empty.
 */
function GridCell({ span, children }: { span: WidgetSpan; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Widgets always render inside a reveal-animation wrapper div, so even a
    // widget returning null leaves at least one (empty) DOM node here —
    // childElementCount alone can't tell "empty" from "has content". Check
    // the whole subtree for anything actually visible instead.
    const hasContent = (el.textContent?.trim().length ?? 0) > 0 || el.querySelector("img, svg, canvas, video") !== null;
    setEmpty(!hasContent);
  }, [children]);

  if (empty) return null;
  return (
    <div ref={ref} className={SPAN_CLASS[span]}>
      {children}
    </div>
  );
}

export type WidgetSpan = "sm" | "md" | "lg";

const SPAN_CLASS: Record<WidgetSpan, string> = {
  sm: "col-span-4 sm:col-span-2 lg:col-span-1",
  md: "col-span-4 lg:col-span-2",
  lg: "col-span-4",
};

/** A section with no explicit span (every legacy stack-only widget) defaults to full-width in a grid — it was built as a full section, not a small card. */
function sectionSpan(section: DisplayProfileDTO["sections"][number]): WidgetSpan {
  const span = (section.config as { span?: unknown } | undefined)?.span;
  return span === "sm" || span === "md" || span === "lg" ? span : "lg";
}

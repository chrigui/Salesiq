"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { WIDGET_REGISTRY } from "./registry";
import type { DisplayPackSummary, DisplayWidgetContext } from "./types";
import type { DisplayProfileDTO } from "@/lib/serializers/displayProfile";
import type { IndustryPack, InventoryItem } from "@/core/types";
import { resolveMotionConfig } from "@/core/display/motionPresets";
import { nearestComparables } from "@/lib/comparables";

export interface DisplayProfileRendererProps {
  profile: DisplayProfileDTO;
  pack: IndustryPack;
  item: InventoryItem;
  mode: DisplayWidgetContext["mode"];
  /** Forwarded from DisplayStage's own claimed-device state — absent in the editor preview, where there's no real kiosk to attribute a lead submission to. */
  deviceId?: string;
  deviceToken?: string;
}

/**
 * Renders a Display Profile's enabled widget composition — shared by the
 * Display Studio editor's live preview and the real Customer Display, so
 * "what you configure is what the customer sees" is a structural guarantee,
 * not a promise the two surfaces could quietly drift apart on. Mirrors
 * src/components/brochure/BrochureView.tsx's scoped --brand/--brand-soft
 * pattern so a profile's brand overrides don't touch the app-wide theme.
 */
export function DisplayProfileRenderer({ profile, pack, item, mode, deviceId, deviceToken }: DisplayProfileRendererProps) {
  const brand = profile.brandOverrides?.brand || profile.resolvedBrandProfile?.brand || pack.branding.brand;
  const brandSoft = profile.brandOverrides?.brandSoft || profile.resolvedBrandProfile?.brandSoft || pack.branding.brandSoft;
  const brandVars = { "--brand": brand, "--brand-soft": brandSoft } as CSSProperties;

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
    },
  };

  const enabled = profile.sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);

  if (enabled.length === 0) {
    return (
      <div style={brandVars} className="grid min-h-[50vh] place-items-center bg-zinc-950">
        <p className="text-sm text-white/40">No widgets enabled for this profile yet.</p>
      </div>
    );
  }

  const assetsBaseUrl = `/api/public/display-profiles/${profile.id}/assets`;
  const motionConfig = resolveMotionConfig(profile.motion);
  const comparables = nearestComparables(pack.inventory, item);

  return (
    <div style={brandVars} className="min-h-screen bg-zinc-950">
      {enabled.map((s, i) => {
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
          />
        );
        if (motionConfig.reduceMotion) {
          return <div key={s.id}>{widget}</div>;
        }
        return (
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
        );
      })}
    </div>
  );
}

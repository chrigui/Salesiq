"use client";

import { useEffect } from "react";
import { useDecisionRoomWidgetContext } from "@/components/display/useDecisionRoomWidgetContext";
import { DisplayGallery } from "@/components/display/widgets/DisplayGallery";
import { DisplaySpecs } from "@/components/display/widgets/DisplaySpecs";
import { DisplayLocationMap } from "@/components/display/widgets/DisplayLocationMap";
import { DisplayPriceSummary } from "@/components/display/widgets/DisplayPriceSummary";
import { DisplayInvestment } from "@/components/display/widgets/DisplayInvestment";
import { DisplayDocuments } from "@/components/display/widgets/DisplayDocuments";
import { trackRecapEvent } from "./trackRecapEvent";
import type { ScoredItem } from "@/core/engine/scoring";
import type { IndustryPack, InventoryItem } from "@/core/types";

/**
 * Progressive-disclosure detail set for one recap property — images,
 * specs, location, floor plan/masterplan, payment, investment, documents.
 * Reuses Display Studio's real widget library through the exact same
 * public-route-safe context ContinueExperience.tsx's own RecapPropertyDetails
 * already established, so payment/investment/document rendering isn't
 * built a third time. A dedicated component (not inlined into the card)
 * because useDecisionRoomWidgetContext is a hook and must only ever be
 * called unconditionally at its own top level — the parent mounts this
 * conditionally per Rules of Hooks, never calls the hook itself.
 */
export function RecapPropertyDetails({
  pack,
  item,
  scored,
  showPayment,
  showInvestment,
  code,
}: {
  pack: IndustryPack;
  item: InventoryItem;
  scored: ScoredItem[];
  showPayment: boolean;
  showInvestment: boolean;
  code: string;
}) {
  const context = useDecisionRoomWidgetContext(pack, item, scored);

  useEffect(() => {
    trackRecapEvent(code, "GalleryView", item.id);
    if (showPayment) trackRecapEvent(code, "PaymentView", item.id);
    if (showInvestment) trackRecapEvent(code, "InvestmentView", item.id);
    // Fire once per mount (i.e. once per expand) only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3 border-t border-white/10 pt-4">
      <DisplayGallery {...context} />
      <DisplaySpecs {...context} />
      <DisplayLocationMap {...context} />
      {showPayment && <DisplayPriceSummary {...context} />}
      {showInvestment && <DisplayInvestment {...context} />}
      <DisplayDocuments {...context} />
    </div>
  );
}

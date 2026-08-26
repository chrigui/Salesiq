"use client";

import { useEffect } from "react";
import { trackRecapEvent } from "./trackRecapEvent";

/**
 * Fires the page-load events real customer usage should produce: a View
 * (also the sole writer of Recap.lastViewedSnapshot — see the events
 * route — so PR11's "since your last visit" diff can ever have a baseline
 * to compare against), and a ComparisonView when the comparison block is
 * actually shown, since that section renders in full on load rather than
 * behind a tap. Mounted once by the server-rendered RecapExperienceView;
 * renders nothing itself.
 */
export function RecapViewTracker({ code, hasComparison }: { code: string; hasComparison: boolean }) {
  useEffect(() => {
    trackRecapEvent(code, "View");
    if (hasComparison) trackRecapEvent(code, "ComparisonView");
    // Fire once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

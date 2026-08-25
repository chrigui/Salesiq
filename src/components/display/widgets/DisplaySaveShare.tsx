"use client";

import { useEffect, useState } from "react";
import { Heart, Share2, Check } from "lucide-react";
import { useSync } from "@/components/providers/SyncProvider";
import { cx, Button } from "@/components/ui/primitives";
import { shareOrCopyLink } from "@/lib/shareLink";
import type { DisplayWidgetContext } from "../types";

/**
 * Save/Share for the customer-facing kiosk. Share reuses the real
 * "continue on your phone" session link (same as DisplayContinueQr/
 * ContinueQr) — a real URL, not invented. Save is deliberately local-only
 * (this browser's localStorage, keyed by item id) rather than a write into
 * BuyerItemRelationship: that endpoint is session-authenticated and, by
 * explicit design (see its route comment), only ever called from the
 * salesperson-controlled Companion — a customer-facing surface must never
 * be able to trigger a write into a buyer's official activity/relationship
 * log. A soft "you liked this" toggle on this one kiosk doesn't need to.
 */
export function DisplaySaveShare({ item, mode }: DisplayWidgetContext) {
  const { continueUrl } = useSync();
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const storageKey = `salesiq.saved.${item.id}`;

  useEffect(() => {
    try {
      setSaved(localStorage.getItem(storageKey) === "1");
    } catch {
      // localStorage can throw in a locked-down kiosk browser — save just stays off
    }
  }, [storageKey]);

  const toggleSave = () => {
    const next = !saved;
    setSaved(next);
    try {
      if (next) localStorage.setItem(storageKey, "1");
      else localStorage.removeItem(storageKey);
    } catch {
      // best-effort only
    }
  };

  const share = async () => {
    if (!continueUrl) return;
    const result = await shareOrCopyLink(continueUrl, item.name);
    if (result === "copied") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!continueUrl && mode !== "preview") return null;

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <Button onClick={toggleSave} variant="outline" active={saved} className="flex-1 text-xs">
        <Heart className={cx("h-3.5 w-3.5", saved && "fill-current")} />
        {saved ? "Saved" : "Save"}
      </Button>
      <Button onClick={share} variant="outline" disabled={!continueUrl} className="flex-1 text-xs">
        {copied ? <Check className="h-3.5 w-3.5 text-brand" /> : <Share2 className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Share"}
      </Button>
    </div>
  );
}

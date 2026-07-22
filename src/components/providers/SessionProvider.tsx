"use client";

import { useEffect } from "react";
import { connectSessionSync, useSession } from "@/core/store/session";
import { getPack } from "@/core/industries";

/**
 * Connects the local store to the cross-surface sync bus and applies the active
 * tenant's brand colours as CSS variables so the entire UI re-skins instantly
 * when the industry pack changes.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const packId = useSession((s) => s.packId);

  useEffect(() => {
    const disconnect = connectSessionSync();
    return disconnect;
  }, []);

  useEffect(() => {
    const pack = getPack(packId);
    const root = document.documentElement;
    root.style.setProperty("--brand", pack.branding.brand);
    root.style.setProperty("--brand-soft", pack.branding.brandSoft);
  }, [packId]);

  return <>{children}</>;
}

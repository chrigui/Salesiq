"use client";

import { useEffect } from "react";
import { connectSessionSync, useSession } from "@/core/store/session";
import { useLivePack } from "@/core/store/packs";

/**
 * Connects the local store to the cross-surface sync bus and applies the active
 * tenant's brand colours as CSS variables so the entire UI re-skins instantly
 * when the industry pack changes — or when an admin edits branding in the
 * Visual Builder (the live pack reacts to draft changes across tabs).
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const packId = useSession((s) => s.packId);
  const pack = useLivePack(packId);

  useEffect(() => {
    const disconnect = connectSessionSync();
    return disconnect;
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand", pack.branding.brand);
    root.style.setProperty("--brand-soft", pack.branding.brandSoft);
  }, [pack.branding.brand, pack.branding.brandSoft]);

  return <>{children}</>;
}

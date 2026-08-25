"use client";

import { useState, useEffect } from "react";
import { DisplayStage } from "./DisplayStage";
import { DisplayProfileRenderer } from "./DisplayProfileRenderer";
import { PairingOverlay } from "@/components/sync/Pairing";
import { DisplayKiosk } from "./DisplayKiosk";
import { DevicePairingPrompt } from "./DevicePairingPrompt";
import { useDisplayDevice, useDeviceLiveProfile } from "@/core/store/displayDevice";
import { useDefaultBrandProfile } from "@/core/store/brandProfiles";
import { useDisplayProfile } from "@/core/store/displayProfiles";
import { useLivePack } from "@/core/store/packs";
import { PACKS } from "@/core/industries";
import { BrandTokenScope } from "./BrandTokenScope";

/**
 * Display Studio's authenticated draft preview — `/display?previewProfileId=X`
 * from the editor's full-screen Preview modal. Fetches the profile through
 * the ordinary authenticated editor route (useDisplayProfile), which
 * requires display-studio.view and returns the live DRAFT (unpublished)
 * content — so it renders whatever the admin has edited, never only what's
 * been published, and a signed-out viewer hitting this URL directly sees
 * nothing (the fetch 401s), never the draft. Deliberately bypasses every
 * other Display concern (pairing, idle, companion sync) — this is a
 * read-only content preview, not a real kiosk session.
 */
function DisplayPreview({ profileId }: { profileId: string }) {
  const { profile, isLoading } = useDisplayProfile(profileId);
  const pack = profile ? PACKS.find((p) => p.id === profile.packId) : undefined;
  const item = pack?.inventory.find((i) => i.id === profile?.itemId);

  if (isLoading) return null;
  if (!profile || !pack || !item) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-950 text-sm text-white/40">
        Preview unavailable — sign in to Display Studio to preview a draft.
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-zinc-950">
      <div className="pointer-events-none fixed left-1/2 top-3 z-[90] -translate-x-1/2 rounded-full bg-amber-500/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-black">
        Preview — draft, not published
      </div>
      <DisplayProfileRenderer profile={profile} pack={pack} item={item} mode="preview" />
    </div>
  );
}

/**
 * Single shared owner of this browser's Display device identity. DisplayStage
 * (needs deviceId/token to poll the idle profile) and DevicePairingPrompt
 * (shows the claim UI) both used to call useDisplayDevice() independently —
 * two separate hook instances raced to auto-claim the same pairing code on
 * mount, each minting its own deviceToken and silently invalidating the
 * other's. Calling the hook once here and passing its result down as props
 * makes claiming happen exactly once per page load.
 */
export function DisplayRoot() {
  // Read directly off window.location — same convention useDisplayDevice()
  // already uses for its own `?pair=` param — rather than next/navigation's
  // useSearchParams(), which would force this route into a Suspense boundary.
  const [previewProfileId, setPreviewProfileId] = useState<string | null>(null);
  useEffect(() => {
    setPreviewProfileId(new URLSearchParams(window.location.search).get("previewProfileId"));
  }, []);

  const device = useDisplayDevice();
  const defaultBrand = useDefaultBrandProfile();

  // A pinned live profile (Display.liveProfileId) takes over the whole
  // screen — a dedicated single-listing showroom, unaffected by whatever
  // the Companion focuses. Unset -> unchanged existing companion-driven
  // behavior via DisplayStage below.
  const liveProfile = useDeviceLiveProfile(device.deviceId, device.token);
  const livePack = useLivePack(liveProfile?.packId ?? "");
  const liveItem = liveProfile ? livePack.inventory.find((i) => i.id === liveProfile.itemId) : undefined;

  // Display Studio's full-journey Preview modal iframes this exact route
  // with ?previewProfileId=X — render the authenticated draft preview and
  // skip every other Display concern (pairing, idle, device claim) entirely.
  if (previewProfileId) {
    return <DisplayPreview profileId={previewProfileId} />;
  }

  return (
    <BrandTokenScope brand={defaultBrand}>
      {liveProfile && liveItem ? (
        <DisplayProfileRenderer
          profile={liveProfile}
          pack={livePack}
          item={liveItem}
          mode="presentation"
          deviceId={device.deviceId ?? undefined}
          deviceToken={device.token ?? undefined}
        />
      ) : (
        <DisplayStage deviceId={device.deviceId} deviceToken={device.token} />
      )}
      <PairingOverlay />
      <DisplayKiosk />
      <DevicePairingPrompt
        claimed={device.claimed}
        claiming={device.claiming}
        claimError={device.claimError}
        claim={device.claim}
      />
    </BrandTokenScope>
  );
}

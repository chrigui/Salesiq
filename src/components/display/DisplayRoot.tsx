"use client";

import { DisplayStage } from "./DisplayStage";
import { DisplayProfileRenderer } from "./DisplayProfileRenderer";
import { PairingOverlay } from "@/components/sync/Pairing";
import { DisplayKiosk } from "./DisplayKiosk";
import { DevicePairingPrompt } from "./DevicePairingPrompt";
import { useDisplayDevice, useDeviceLiveProfile } from "@/core/store/displayDevice";
import { useDefaultBrandProfile } from "@/core/store/brandProfiles";
import { useLivePack } from "@/core/store/packs";
import { BrandTokenScope } from "./BrandTokenScope";

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
  const device = useDisplayDevice();
  const defaultBrand = useDefaultBrandProfile();

  // A pinned live profile (Display.liveProfileId) takes over the whole
  // screen — a dedicated single-listing showroom, unaffected by whatever
  // the Companion focuses. Unset -> unchanged existing companion-driven
  // behavior via DisplayStage below.
  const liveProfile = useDeviceLiveProfile(device.deviceId, device.token);
  const livePack = useLivePack(liveProfile?.packId ?? "");
  const liveItem = liveProfile ? livePack.inventory.find((i) => i.id === liveProfile.itemId) : undefined;

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

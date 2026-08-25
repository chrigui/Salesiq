"use client";

import { DisplayStage } from "./DisplayStage";
import { PairingOverlay } from "@/components/sync/Pairing";
import { DisplayKiosk } from "./DisplayKiosk";
import { DevicePairingPrompt } from "./DevicePairingPrompt";
import { useDisplayDevice } from "@/core/store/displayDevice";
import { useDefaultBrandProfile } from "@/core/store/brandProfiles";
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

  return (
    <BrandTokenScope brand={defaultBrand}>
      <DisplayStage deviceId={device.deviceId} deviceToken={device.token} />
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

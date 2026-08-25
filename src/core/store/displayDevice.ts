"use client";

import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import type { DisplayProfileDTO } from "@/lib/serializers/displayProfile";

const STORAGE_KEY = "salesiq.display.device";

interface StoredDevice {
  deviceId: string;
  token: string;
}

function readStoredDevice(): StoredDevice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.deviceId === "string" && typeof parsed?.token === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}

function writeStoredDevice(device: StoredDevice) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(device));
  } catch {
    // Private browsing / storage disabled — the kiosk just re-pairs every load, not fatal.
  }
}

async function claimPairingCode(pairingCode: string): Promise<StoredDevice | null> {
  const res = await fetch("/api/displays/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pairingCode }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return { deviceId: data.displayId as string, token: data.deviceToken as string };
}

/**
 * A physical kiosk's persistent identity — independent of the ephemeral
 * MQTT room code SyncProvider mints per page load. Auto-claims from a
 * `?pair=CODE` URL param (the deep link a registered Display's QR points
 * at) the first time it's seen, then persists the resulting device token in
 * localStorage so the kiosk stays claimed across reloads without scanning
 * again. Exposes a manual `claim()` for the code-entry fallback.
 */
export function useDisplayDevice(): {
  deviceId: string | null;
  token: string | null;
  claimed: boolean;
  claiming: boolean;
  claimError: string | null;
  claim: (pairingCode: string) => Promise<boolean>;
} {
  const [device, setDevice] = useState<StoredDevice | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const claim = useCallback(async (pairingCode: string): Promise<boolean> => {
    setClaiming(true);
    setClaimError(null);
    const result = await claimPairingCode(pairingCode);
    setClaiming(false);
    if (!result) {
      setClaimError("That pairing code wasn't recognized.");
      return false;
    }
    writeStoredDevice(result);
    setDevice(result);
    return true;
  }, []);

  useEffect(() => {
    const stored = readStoredDevice();
    if (stored) {
      setDevice(stored);
      setHydrated(true);
      return;
    }
    const pairCode = new URLSearchParams(window.location.search).get("pair");
    if (pairCode) {
      claim(pairCode).finally(() => setHydrated(true));
    } else {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    deviceId: device?.deviceId ?? null,
    token: device?.token ?? null,
    claimed: hydrated && device !== null,
    claiming,
    claimError,
    claim,
  };
}

interface DeviceConfigResponse {
  idleProfile: DisplayProfileDTO | null;
  liveProfile: DisplayProfileDTO | null;
  display: { defaultExperience: "Welcome" | "PropertyHero" | "CustomIntro" };
}

function useDeviceConfig(deviceId: string | null, token: string | null): DeviceConfigResponse | undefined {
  const key = deviceId && token ? `/api/displays/${deviceId}/config?token=${encodeURIComponent(token)}` : null;
  const { data } = useSWR<DeviceConfigResponse>(
    key,
    (url: string) => fetch(url).then((res) => (res.ok ? res.json() : { idleProfile: null, liveProfile: null, display: { defaultExperience: "Welcome" } })),
    { refreshInterval: 30_000 },
  );
  return data;
}

/**
 * Polls this Display's resolved idle configuration every 30s — same cadence
 * as useResolvedDisplayProfile's live-item resolver — so a publish reaches
 * an already-running kiosk without a manual reload. Also doubles as the
 * heartbeat the dashboard's online/offline indicator is computed from
 * server-side (see toDisplayDTO), purely as a side effect of the route
 * updating lastSeenAt on every successful call.
 */
export function useDeviceIdleProfile(deviceId: string | null, token: string | null): DisplayProfileDTO | null {
  return useDeviceConfig(deviceId, token)?.idleProfile ?? null;
}

/**
 * Mirrors useDeviceIdleProfile — this Display's pinned "live" profile
 * (Display.liveProfileId), when set: a dedicated single-listing screen that
 * renders continuously regardless of what the Companion focuses, e.g. an
 * Investment Center showroom display. Shares the same poll (same SWR key),
 * so this costs no extra network round-trip beyond useDeviceIdleProfile's.
 */
export function useDeviceLiveProfile(deviceId: string | null, token: string | null): DisplayProfileDTO | null {
  return useDeviceConfig(deviceId, token)?.liveProfile ?? null;
}

/** This Display's configured default experience — only meaningful when no live profile is pinned (see useDeviceLiveProfile). */
export function useDeviceDefaultExperience(
  deviceId: string | null,
  token: string | null,
): "Welcome" | "PropertyHero" | "CustomIntro" {
  return useDeviceConfig(deviceId, token)?.display.defaultExperience ?? "Welcome";
}

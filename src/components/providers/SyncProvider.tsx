"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";
import { connectNetwork, disconnectNetwork } from "@/core/store/session";
import { makeRoomCode, type SyncStatus } from "@/core/sync/network";

type Role = "display" | "companion" | null;

interface SyncValue {
  role: Role;
  room: string | null;
  status: SyncStatus;
  /** Companion: join a display's room by code. */
  setRoom: (code: string) => void;
  /** Deep link that opens the Companion already paired to this room. */
  companionUrl: string | null;
}

const SyncContext = createContext<SyncValue>({
  role: null,
  room: null,
  status: "idle",
  setRoom: () => {},
  companionUrl: null,
});

export const useSync = () => useContext(SyncContext);

function readRoomFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const r = new URLSearchParams(window.location.search).get("room");
  return r ? r.toUpperCase() : null;
}

function writeRoomToUrl(code: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("room", code);
  window.history.replaceState({}, "", url.toString());
}

/**
 * Manages the cross-device pairing room and exposes its live status.
 * - Display: mints a room code on first load (and puts it in the URL) so it can
 *   be shown as a QR / short code.
 * - Companion: joins the room from the URL (?room=CODE) or a typed code.
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const role: Role = pathname?.startsWith("/display")
    ? "display"
    : pathname?.startsWith("/companion")
      ? "companion"
      : null;

  const [room, setRoomState] = useState<string | null>(null);
  const [status, setStatus] = useState<SyncStatus>("idle");

  // Establish the room on mount (client only).
  useEffect(() => {
    if (!role) return;
    const fromUrl = readRoomFromUrl();
    if (fromUrl) {
      setRoomState(fromUrl);
    } else if (role === "display") {
      const code = makeRoomCode();
      writeRoomToUrl(code);
      setRoomState(code);
    }
    // Companion with no code stays unpaired until the user enters one.
  }, [role]);

  // Connect to the network whenever we have a role + room.
  useEffect(() => {
    if (!role || !room) return;
    setStatus("connecting");
    const disconnect = connectNetwork({ room, role, onStatus: setStatus });
    return () => {
      disconnect();
      disconnectNetwork();
    };
  }, [role, room]);

  const setRoom = useCallback((code: string) => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    writeRoomToUrl(c);
    setRoomState(c);
  }, []);

  const companionUrl = useMemo(() => {
    if (!room || typeof window === "undefined") return null;
    return `${window.location.origin}/companion?room=${room}`;
  }, [room]);

  const value = useMemo(
    () => ({ role, room, status, setRoom, companionUrl }),
    [role, room, status, setRoom, companionUrl],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

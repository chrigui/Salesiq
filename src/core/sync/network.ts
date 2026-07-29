"use client";

import mqtt, { type MqttClient } from "mqtt";
import { decryptForRoom, encryptForRoom } from "./crypto";

/**
 * Cross-device session sync over MQTT-over-WebSocket.
 *
 * The same-device path uses BroadcastChannel (see session-bus.ts). To let a
 * phone (Sales Companion) drive a laptop/TV (Customer Display), we need a
 * network relay. A public MQTT broker over WSS works from any browser with
 * zero backend — which matters because the app is hosted on Vercel, where
 * persistent WebSocket servers can't run.
 *
 * State is published with `retain: true` so a surface that opens later
 * immediately receives the most recent state (late-join hydration). The broker
 * is configurable: point NEXT_PUBLIC_SYNC_BROKER at a private/managed relay for
 * production. Room codes namespace each pairing so sessions never cross.
 *
 * Module 7 additions on top of the original transport:
 *  - Secure Messaging: every payload is AES-GCM encrypted with a key derived
 *    from the room code (see crypto.ts) — opaque to anyone but a peer who has
 *    the same code.
 *  - Heartbeat Monitoring / Presence Detection: each side republishes a
 *    timestamped presence beacon every few seconds; a peer that stops
 *    beaconing is detected as gone (status falls back from "paired" to
 *    "connected") instead of staying falsely marked as paired forever.
 *  - Offline Mode: a publish() made while disconnected is queued (only the
 *    latest matters for a state-sync channel) and flushed the moment the
 *    connection — or a reconnect — comes back, instead of being silently
 *    dropped.
 */

export type SyncStatus =
  | "idle"
  | "connecting"
  | "connected" // socket up, no peer seen recently
  | "paired" // received a live state/presence beacon from the peer recently
  | "offline" // socket down; local changes are queued and will sync on reconnect
  | "error";

export const SYNC_BROKER =
  process.env.NEXT_PUBLIC_SYNC_BROKER || "wss://broker.emqx.io:8084/mqtt";
export const SYNC_PREFIX = process.env.NEXT_PUBLIC_SYNC_PREFIX || "salesiq";

/** How often each side re-announces presence. */
const HEARTBEAT_MS = 8000;
/** No peer beacon within this window → treat the peer as gone. */
const PEER_TIMEOUT_MS = 24000;

export interface NetworkTransport<T> {
  publish: (state: T) => void;
  disconnect: () => void;
}

interface Envelope<T> {
  origin: string;
  ts: number;
  state: T;
}

export function createNetworkTransport<T>(opts: {
  room: string;
  origin: string;
  role: "display" | "companion";
  onRemote: (state: T) => void;
  onStatus: (status: SyncStatus) => void;
}): NetworkTransport<T> {
  const { room, origin, role, onRemote, onStatus } = opts;
  const stateTopic = `${SYNC_PREFIX}/${room}/state`;
  const presenceTopic = `${SYNC_PREFIX}/${room}/presence/${origin}`;
  const presenceWildcard = `${SYNC_PREFIX}/${room}/presence/+`;

  let pendingState: T | null = null;
  let lastPeerSeenAt = 0;
  let connected = false;
  let disposed = false;

  onStatus("connecting");

  const client: MqttClient = mqtt.connect(SYNC_BROKER, {
    clientId: `${SYNC_PREFIX}-${role}-${origin}`,
    reconnectPeriod: 3000,
    connectTimeout: 8000,
    clean: true,
    // Clear our retained presence if we drop unexpectedly.
    will: { topic: presenceTopic, payload: "", qos: 0, retain: true },
  });

  function reportStatus() {
    if (disposed) return;
    if (!connected) {
      onStatus(pendingState !== null ? "offline" : "connecting");
      return;
    }
    const peerAlive = Date.now() - lastPeerSeenAt < PEER_TIMEOUT_MS;
    onStatus(peerAlive ? "paired" : "connected");
  }

  async function publishPresence() {
    if (!client.connected) return;
    const payload = await encryptForRoom(
      room,
      JSON.stringify({ role, origin, ts: Date.now() }),
    );
    client.publish(presenceTopic, payload, { qos: 0, retain: true });
  }

  async function publishState(state: T) {
    if (!client.connected) return;
    const env: Envelope<T> = { origin, ts: Date.now(), state };
    const payload = await encryptForRoom(room, JSON.stringify(env));
    client.publish(stateTopic, payload, { qos: 0, retain: true });
  }

  const heartbeat = setInterval(() => {
    publishPresence();
    reportStatus(); // lets a peer timeout surface even with no new messages
  }, HEARTBEAT_MS);

  client.on("connect", () => {
    connected = true;
    client.subscribe([stateTopic, presenceWildcard], { qos: 0 });
    publishPresence();
    // Flush anything queued while we were offline — only the latest state
    // matters for a sync channel, so no backlog to replay in order.
    if (pendingState !== null) {
      const toSend = pendingState;
      pendingState = null;
      publishState(toSend);
    }
    reportStatus();
  });

  client.on("reconnect", () => {
    connected = false;
    reportStatus();
  });
  client.on("error", () => onStatus("error"));
  client.on("close", () => {
    connected = false;
    reportStatus();
  });

  client.on("message", async (topic, payload) => {
    const raw = payload.toString();
    if (!raw) return;
    const text = await decryptForRoom(room, raw);
    if (!text) return;

    if (topic === stateTopic) {
      try {
        const env = JSON.parse(text) as Envelope<T>;
        if (env.origin === origin) return; // ignore our own echo
        lastPeerSeenAt = Date.now();
        reportStatus();
        onRemote(env.state);
      } catch {
        /* ignore malformed */
      }
    } else if (topic.startsWith(`${SYNC_PREFIX}/${room}/presence/`)) {
      if (topic.endsWith(origin)) return; // our own beacon
      try {
        const p = JSON.parse(text) as { role: string; origin: string; ts: number };
        if (p.role && p.role !== role) {
          lastPeerSeenAt = Date.now();
          reportStatus();
        }
      } catch {
        /* ignore */
      }
    }
  });

  return {
    publish(state: T) {
      if (!client.connected) {
        pendingState = state;
        reportStatus();
        return;
      }
      publishState(state);
    },
    disconnect() {
      disposed = true;
      clearInterval(heartbeat);
      try {
        client.publish(presenceTopic, "", { qos: 0, retain: true });
        client.end(true);
      } catch {
        /* ignore */
      }
    },
  };
}

/** Short, unambiguous room code (no 0/O/1/I). */
export function makeRoomCode(len = 4): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++)
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

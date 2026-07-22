"use client";

import mqtt, { type MqttClient } from "mqtt";

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
 */

export type SyncStatus =
  | "idle"
  | "connecting"
  | "connected" // socket up, no peer seen yet
  | "paired" // received state/presence from the other device
  | "error";

export const SYNC_BROKER =
  process.env.NEXT_PUBLIC_SYNC_BROKER || "wss://broker.emqx.io:8084/mqtt";
export const SYNC_PREFIX = process.env.NEXT_PUBLIC_SYNC_PREFIX || "salesiq";

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

  onStatus("connecting");

  const client: MqttClient = mqtt.connect(SYNC_BROKER, {
    clientId: `${SYNC_PREFIX}-${role}-${origin}`,
    reconnectPeriod: 3000,
    connectTimeout: 8000,
    clean: true,
    // Clear our retained presence if we drop unexpectedly.
    will: { topic: presenceTopic, payload: "", qos: 0, retain: true },
  });

  client.on("connect", () => {
    onStatus("connected");
    client.subscribe([stateTopic, presenceWildcard], { qos: 0 });
    // Announce ourselves so the peer knows a device joined.
    client.publish(presenceTopic, JSON.stringify({ role, origin }), {
      qos: 0,
      retain: true,
    });
  });

  client.on("reconnect", () => onStatus("connecting"));
  client.on("error", () => onStatus("error"));
  client.on("close", () => onStatus("connecting"));

  client.on("message", (topic, payload) => {
    const text = payload.toString();
    if (!text) return;
    if (topic === stateTopic) {
      try {
        const env = JSON.parse(text) as Envelope<T>;
        if (env.origin === origin) return; // ignore our own echo
        onStatus("paired");
        onRemote(env.state);
      } catch {
        /* ignore malformed */
      }
    } else if (topic.startsWith(`${SYNC_PREFIX}/${room}/presence/`)) {
      // A presence message from a different client means someone is there.
      if (!topic.endsWith(origin)) {
        try {
          const p = JSON.parse(text) as { role: string };
          if (p.role && p.role !== role) onStatus("paired");
        } catch {
          /* ignore */
        }
      }
    }
  });

  return {
    publish(state: T) {
      if (!client.connected) return;
      const env: Envelope<T> = { origin, ts: Date.now(), state };
      client.publish(stateTopic, JSON.stringify(env), { qos: 0, retain: true });
    },
    disconnect() {
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

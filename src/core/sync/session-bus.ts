/**
 * Cross-surface session sync.
 *
 * The Sales Companion (phone) and the Customer Display (big screen) are two
 * separate surfaces that must stay in perfect lockstep. In this demo they run
 * as two browser tabs/windows and sync instantly over a BroadcastChannel, with
 * a localStorage fallback so a freshly-opened surface hydrates to the latest
 * state. In production this same seam is a WebSocket to the session service —
 * the surface code does not change.
 */

export interface SyncEnvelope<T> {
  origin: string; // unique per surface instance
  ts: number;
  state: T;
}

const CHANNEL = "salesiq-session";
const STORAGE_KEY = "salesiq-session-state";

export function createSessionBus<T>(origin: string) {
  const isBrowser = typeof window !== "undefined";
  const channel =
    isBrowser && "BroadcastChannel" in window
      ? new BroadcastChannel(CHANNEL)
      : null;

  return {
    /** Broadcast the latest state to every other surface and persist it. */
    publish(state: T) {
      if (!isBrowser) return;
      const envelope: SyncEnvelope<T> = { origin, ts: Date.now(), state };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
      } catch {
        /* storage may be unavailable (private mode) — channel still works */
      }
      channel?.postMessage(envelope);
    },

    /** Subscribe to state produced by other surfaces. Returns an unsubscribe. */
    subscribe(handler: (state: T, envelope: SyncEnvelope<T>) => void) {
      if (!isBrowser) return () => {};
      const onMessage = (e: MessageEvent<SyncEnvelope<T>>) => {
        if (e.data && e.data.origin !== origin) handler(e.data.state, e.data);
      };
      const onStorage = (e: StorageEvent) => {
        if (e.key !== STORAGE_KEY || !e.newValue) return;
        const env = JSON.parse(e.newValue) as SyncEnvelope<T>;
        if (env.origin !== origin) handler(env.state, env);
      };
      channel?.addEventListener("message", onMessage);
      window.addEventListener("storage", onStorage);
      return () => {
        channel?.removeEventListener("message", onMessage);
        window.removeEventListener("storage", onStorage);
      };
    },

    /** Read the last persisted state (used to hydrate a new surface). */
    hydrate(): SyncEnvelope<T> | null {
      if (!isBrowser) return null;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as SyncEnvelope<T>) : null;
      } catch {
        return null;
      }
    },
  };
}

export function newOrigin(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

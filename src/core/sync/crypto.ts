/**
 * Secure Messaging (Module 7 · MQTT Real-Time Engine).
 *
 * The cross-device sync transport (network.ts) runs over a *public* MQTT
 * broker with no backend of our own — anyone who subscribes to a wildcard
 * topic (`salesiq/+/state`) can passively harvest every tenant's live
 * session data unless the payload itself is opaque. TLS (wss://) only
 * protects the wire to the broker; retained messages sitting on the broker,
 * or another client's wildcard subscription, are unprotected by transport
 * security alone.
 *
 * Every state/presence payload is AES-GCM encrypted with a key derived from
 * the room code via SHA-256 (Web Crypto, no dependency). This doesn't
 * protect against someone who already has the room code — that's the same
 * trust boundary as being handed the QR code — but it does stop a passive
 * wildcard subscriber from reading a session they were never given the code
 * for. Falls back to plaintext (with a console warning) if Web Crypto is
 * unavailable — e.g. a non-secure-context dev server — so pairing never
 * hard-fails over this.
 */

const hasSubtleCrypto =
  typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined";

const keyCache = new Map<string, Promise<CryptoKey>>();

async function deriveRoomKey(room: string): Promise<CryptoKey> {
  const cached = keyCache.get(room);
  if (cached) return cached;
  const promise = (async () => {
    const material = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`salesiq-room-v1:${room}`),
    );
    return crypto.subtle.importKey("raw", material, "AES-GCM", false, [
      "encrypt",
      "decrypt",
    ]);
  })();
  keyCache.set(room, promise);
  return promise;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/** Encrypt a plaintext string for a room. Returns a JSON string safe to publish. */
export async function encryptForRoom(room: string, plaintext: string): Promise<string> {
  if (!hasSubtleCrypto) {
    console.warn("Web Crypto unavailable — publishing sync payload unencrypted.");
    return JSON.stringify({ v: 0, data: plaintext });
  }
  try {
    const key = await deriveRoomKey(room);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(plaintext),
    );
    return JSON.stringify({
      v: 1,
      iv: toBase64(iv),
      data: toBase64(new Uint8Array(ciphertext)),
    });
  } catch {
    return JSON.stringify({ v: 0, data: plaintext });
  }
}

/** Decrypt a payload published by encryptForRoom. Returns null on failure. */
export async function decryptForRoom(room: string, blob: string): Promise<string | null> {
  try {
    const parsed = JSON.parse(blob) as { v: number; iv?: string; data: string };
    if (parsed.v === 0) return parsed.data; // unencrypted fallback payload
    if (!hasSubtleCrypto || !parsed.iv) return null;
    const key = await deriveRoomKey(room);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(parsed.iv) },
      key,
      fromBase64(parsed.data),
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
}

import "server-only";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

// Same unambiguous alphabet as core/sync/network.ts's makeRoomCode() and
// lib/brochures/slug.ts (no 0/O/1/I) — short enough to type by hand if the
// QR scan fails, checked for uniqueness against the DB since it's a
// permanent credential (a Display keeps its pairingCode after claiming),
// unlike the MQTT room code which is minted fresh per page load.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(len = 6): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** Generates a pairing code guaranteed unique against the Display table, retrying on the rare collision. */
export async function generateUniquePairingCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const existing = await prisma.display.findUnique({ where: { pairingCode: code }, select: { id: true } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique display pairing code after 5 attempts.");
}

/** A fresh, unguessable device credential minted once at claim time. Long — this is the actual bearer token every config poll sends, not something typed by hand. */
export function generateDeviceToken(): string {
  return randomBytes(32).toString("hex");
}

import "server-only";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

// Same unambiguous alphabet as brochures' slug/displays' pairingCode (no
// 0/O/1/I) — a permanent public URL, checked for uniqueness against the DB.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(len = 8): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** Generates a share code guaranteed unique against the SharedExperience table, retrying on the rare collision. */
export async function generateUniqueShareCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const existing = await prisma.sharedExperience.findUnique({ where: { code }, select: { id: true } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique share code after 5 attempts.");
}

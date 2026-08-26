import "server-only";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

// Same unambiguous alphabet as SharedExperience's share code / brochures'
// slug / displays' pairingCode (no 0/O/1/I) — a permanent public URL,
// checked for uniqueness against the DB. Kept as its own small copy rather
// than importing sharedExperiences/code.ts's randomCode(): same pattern,
// different table to check uniqueness against, and this keeps the Recap
// code path fully independent of SharedExperience's.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(len = 8): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** Generates a recap code guaranteed unique against the Recap table, retrying on the rare collision. */
export async function generateUniqueRecapCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const existing = await prisma.recap.findUnique({ where: { code }, select: { id: true } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique recap code after 5 attempts.");
}

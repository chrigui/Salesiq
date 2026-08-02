import "server-only";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

// Unambiguous alphabet (no 0/O/1/I) — same spirit as core/sync/network.ts's
// makeRoomCode(), just longer since this is a permanent public URL, not a
// short-lived pairing code, and collisions must be checked against the DB.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomSlug(len = 8): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** Generates a slug guaranteed unique against the Brochure table, retrying on the rare collision. */
export async function generateUniqueBrochureSlug(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = randomSlug();
    const existing = await prisma.brochure.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) return slug;
  }
  throw new Error("Could not generate a unique brochure slug after 5 attempts.");
}

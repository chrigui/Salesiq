import "server-only";
import { prisma } from "@/lib/db";

/** Lowercased/trimmed — the email matching key. Empty string normalizes to null (no match key). */
function normalizeEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  return trimmed ? trimmed : null;
}

/** Digits-only — the phone matching key (ignores +/spaces/dashes, same tolerance as the WhatsApp deep-link helper elsewhere). */
function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/[^\d]/g, "");
  return digits.length >= 6 ? digits : null;
}

export interface MatchOrCreateInput {
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  branchId?: string | null;
  assignedToId?: string | null;
}

/**
 * The core of Buyer Intelligence's identity model: the same person across
 * multiple sessions/leads resolves to one BuyerProfile instead of a fresh
 * disconnected row every time. Matches by exact normalized email OR phone
 * within the tenant — real matching has some inherent false-positive/
 * negative risk (a shared family email, a typo'd digit), which is accepted
 * as the tradeoff for "SalesIQ shouldn't need to re-ask." Returns null if
 * neither email nor phone normalizes to a usable key and no name was given
 * (nothing to identify or create a profile from).
 */
export async function matchOrCreateBuyerProfile(input: MatchOrCreateInput) {
  const emailNormalized = input.email ? normalizeEmail(input.email) : null;
  const phoneNormalized = input.phone ? normalizePhone(input.phone) : null;
  const name = input.name.trim();

  if (!emailNormalized && !phoneNormalized) return null;
  if (!name) return null;

  const existing = await prisma.buyerProfile.findFirst({
    where: {
      tenantId: input.tenantId,
      OR: [
        ...(emailNormalized ? [{ emailNormalized }] : []),
        ...(phoneNormalized ? [{ phoneNormalized }] : []),
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return prisma.buyerProfile.update({
      where: { id: existing.id },
      data: {
        // Fill in a contact channel the profile didn't have yet, without
        // overwriting one it already has (matching on phone shouldn't blank
        // out a previously-captured email, and vice versa).
        email: existing.email || input.email || "",
        phone: existing.phone || input.phone || "",
        emailNormalized: existing.emailNormalized ?? emailNormalized,
        phoneNormalized: existing.phoneNormalized ?? phoneNormalized,
        branchId: existing.branchId ?? input.branchId ?? null,
        assignedToId: existing.assignedToId ?? input.assignedToId ?? null,
        lastInteractionAt: new Date(),
      },
    });
  }

  return prisma.buyerProfile.create({
    data: {
      tenantId: input.tenantId,
      name,
      email: input.email ?? "",
      phone: input.phone ?? "",
      emailNormalized,
      phoneNormalized,
      branchId: input.branchId ?? null,
      assignedToId: input.assignedToId ?? null,
      lastInteractionAt: new Date(),
    },
  });
}

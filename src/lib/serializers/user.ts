import type { User as PrismaUser } from "@/generated/prisma/client";

/** Client-facing shape — mirrors src/core/data/users.ts's AppUser exactly. Never includes passwordHash. */
export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: PrismaUser["role"];
  branchId: string | null;
  status: PrismaUser["status"];
  mfaEnabled: boolean;
  lastLogin: number | null;
  createdAt: number;
  device: string | null;
}

export function toUserDTO(row: PrismaUser): UserDTO {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    branchId: row.branchId,
    status: row.status,
    mfaEnabled: row.mfaEnabled,
    lastLogin: row.lastLoginAt?.getTime() ?? null,
    createdAt: row.createdAt.getTime(),
    device: row.device,
  };
}

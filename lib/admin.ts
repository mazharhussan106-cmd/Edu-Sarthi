// Owns what every admin action shares: confirming the caller is an admin, and
// writing the AdminLog row that records who did what to whom.
//
// It deliberately does NOT trust middleware. Middleware protects /admin pages,
// but the /api/admin routes are reachable directly, and the role in the JWT is
// re-checked against the database here — a demoted admin keeps an ADMIN token
// until it expires.

import type { Prisma } from "@prisma/client";

import { isRevoked } from "@/lib/activeUser";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireAdmin(): Promise<{ id: string } | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id || session.user.role !== "ADMIN") return null;
  const row = await prisma.user.findUnique({ where: { id }, select: { role: true, suspendedAt: true, sessionsValidFrom: true } });
  if (row && isRevoked(session.user.loginAt, row.sessionsValidFrom)) return null;
  return row?.role === "ADMIN" && !row.suspendedAt ? { id } : null;
}

export async function logAdmin(
  actorId: string | null,
  action: string,
  targetType: string,
  targetId: string | null,
  detail?: Prisma.InputJsonValue,
) {
  await prisma.adminLog.create({ data: { actorId, action, targetType, targetId, detail } });
}

/// Reads a JSON body without throwing. Every admin route starts with it.
export async function readBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

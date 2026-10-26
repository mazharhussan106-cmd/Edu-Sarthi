// Owns remembering a person's last answers to the AI card maker's questions,
// so the next round starts from what they chose before.
//
// They live in the existing User.preferences JSON under "aiCards", not in a
// column. It deliberately does NOT go through the Settings preferences schema:
// that is a strict allowlist for settings a person edits by hand, and these are
// written by the app after each round. Settings saves keep unknown keys, so
// the two never overwrite each other.

import { Prisma } from "@prisma/client";
import { z } from "zod";

import { STABLE_IDS, type Remembered } from "@/lib/aiCards";
import { prisma } from "@/lib/prisma";

const shape = z.record(z.string(), z.array(z.string().max(60)).max(8));

export async function loadRemembered(userId: string): Promise<Remembered> {
  const row = await prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } });
  const stored = row?.preferences && typeof row.preferences === "object" ? (row.preferences as Record<string, unknown>).aiCards : undefined;
  const parsed = shape.safeParse(stored ?? {});
  if (!parsed.success) return {};
  // Only the ids this feature knows; anything else stored there is ignored.
  return Object.fromEntries(Object.entries(parsed.data).filter(([k]) => (STABLE_IDS as readonly string[]).includes(k)));
}

/// Writes one key inside the JSON in a single statement. Read-then-write would
/// lose a Settings change saved between the two.
export async function saveRemembered(userId: string, remembered: Remembered): Promise<void> {
  await prisma.$executeRaw(Prisma.sql`
    UPDATE "User"
    SET preferences = jsonb_set(COALESCE(preferences, '{}'::jsonb), '{aiCards}', ${JSON.stringify(remembered)}::jsonb)
    WHERE id = ${userId}`);
}

// Owns per-setting preference saves. One PATCH per changed setting — no Save
// button, and no unsaved-changes state for the settings page to track.
//
// It merges rather than replaces. Two settings changed in quick succession
// would otherwise race, and the second write would silently drop the first.
//
// It deliberately does NOT handle the theme. That needs a cookie as well as a
// row, so it has its own route at /api/profile/theme.

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PREFERENCES, PREFERENCE_SCHEMA } from "@/lib/preferences";

const patchSchema = PREFERENCE_SCHEMA.partial().refine(
  (v) => Object.keys(v).length > 0,
  { message: "Nothing to change." },
);

export async function PATCH(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      { error: "Your session has expired. Sign in and try again." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Could not save that setting." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "That is not a setting we recognise." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });

  // Whatever is already stored may predate a preference being added, so it is
  // parsed loosely and layered over the defaults rather than trusted whole.
  const existing =
    user?.preferences && typeof user.preferences === "object"
      ? (user.preferences as Record<string, unknown>)
      : {};

  const merged = { ...DEFAULT_PREFERENCES, ...existing, ...parsed.data };

  await prisma.user.update({
    where: { id: userId },
    data: { preferences: merged },
  });

  return NextResponse.json({ ok: true, preferences: merged });
}

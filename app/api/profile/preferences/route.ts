// Owns per-setting preference saves. One PATCH per changed setting — no Save
// button, and no unsaved-changes state for the settings page to track.
//
// It merges rather than replaces. Two settings changed in quick succession
// would otherwise race, and the second write would silently drop the first.
//
// It deliberately does NOT handle the theme. That needs a cookie as well as a
// row, so it has its own route at /api/profile/theme.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { requireUser } from "@/lib/apiUser";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PREFERENCES, PREFERENCE_SCHEMA } from "@/lib/preferences";
import { HINDI_COOKIE } from "@/lib/hindiToggle";
import { TEXT_SIZE_COOKIE } from "@/lib/textSize";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const patchSchema = PREFERENCE_SCHEMA.partial().refine(
  (v) => Object.keys(v).length > 0,
  { message: "Nothing to change." },
);

export async function PATCH(req: Request) {
  const gate = await requireUser();
  if (!gate.ok) return gate.res;
  const userId = gate.id;

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

  // After the row is saved, so a failed write never leaves a cookie claiming a
  // size the account does not have. The server render reads this cookie.
  if (parsed.data.textSize) {
    const store = await cookies();
    store.set(TEXT_SIZE_COOKIE, parsed.data.textSize, {
      maxAge: ONE_YEAR_SECONDS,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }

  if (typeof parsed.data.hideHindi === "boolean") {
    const store = await cookies();
    store.set(HINDI_COOKIE, parsed.data.hideHindi ? "off" : "on", {
      maxAge: ONE_YEAR_SECONDS,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }

  return NextResponse.json({ ok: true, preferences: merged });
}

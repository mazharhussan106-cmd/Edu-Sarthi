// Owns per-setting preference saves. One PATCH per changed setting — no Save
// button, and no unsaved-changes state for the settings page to track.
//
// It merges rather than replaces, and in the database, in one statement. Two
// settings changed in quick succession (switch the reminder on, then pick its
// time) arrive as two requests at once; a read here followed by a write of the
// whole object let the second silently undo the first. Missing keys are not
// filled in: prefsOf reads every key over its default.
//
// It deliberately does NOT handle the theme. That needs a cookie as well as a
// row, so it has its own route at /api/profile/theme.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { requireUser } from "@/lib/apiUser";
import { prisma } from "@/lib/prisma";
import { PREFERENCE_SCHEMA, prefsOf } from "@/lib/preferences";
import { DATA_SAVER_COOKIE } from "@/lib/dataSaver";
import { HINDI_COOKIE } from "@/lib/hindiToggle";
import { MOTION_COOKIE } from "@/lib/motion";
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

  // jsonb || jsonb merges keys, the patch winning. A stored value that is not
  // an object (empty, or JSON null from long ago) is treated as {}.
  const patch = JSON.stringify(parsed.data);
  const rows = await prisma.$queryRaw<{ preferences: unknown }[]>`
    UPDATE "User"
    SET preferences = (CASE WHEN jsonb_typeof(preferences) = 'object' THEN preferences ELSE '{}'::jsonb END) || ${patch}::jsonb
    WHERE id = ${userId}
    RETURNING preferences`;
  if (rows.length === 0) return NextResponse.json({ error: "Your session has expired. Sign in again." }, { status: 401 });
  const merged = prefsOf(rows[0].preferences);

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

  if (typeof parsed.data.dataSaver === "boolean") {
    const store = await cookies();
    store.set(DATA_SAVER_COOKIE, parsed.data.dataSaver ? "on" : "off", {
      maxAge: ONE_YEAR_SECONDS,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }

  if (typeof parsed.data.reduceMotion === "boolean") {
    const store = await cookies();
    store.set(MOTION_COOKIE, parsed.data.reduceMotion ? "reduce" : "normal", {
      maxAge: ONE_YEAR_SECONDS,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }

  return NextResponse.json({ ok: true, preferences: merged });
}

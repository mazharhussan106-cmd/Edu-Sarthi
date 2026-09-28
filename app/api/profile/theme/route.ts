// Owns theme persistence: sets the cookie the server render reads, and mirrors
// it to the user row when someone is signed in.
//
// The cookie is the source of truth for rendering because it is available
// before any query runs — that is what prevents a flash of the wrong theme.
// The database column exists so the choice survives a new device.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { attrFromTheme, isTheme, THEME_COOKIE } from "@/lib/theme";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function PATCH(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Could not save the theme." }, { status: 400 });
  }

  const theme = (body as { theme?: unknown })?.theme;
  if (!isTheme(theme)) {
    return NextResponse.json({ error: "Unknown theme." }, { status: 400 });
  }

  const store = await cookies();
  store.set(THEME_COOKIE, attrFromTheme(theme), {
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
    sameSite: "lax",
    // httpOnly is fine: the server reads it with next/headers, and the client
    // gets the current value as a prop rather than by parsing document.cookie.
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  const session = await auth();

  // Signed out is a valid case — a visitor picking a theme on the landing page
  // gets the cookie and nothing else. Not an error.
  if (session?.user?.id) {
    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { theme },
      });
    } catch {
      // The cookie is already set, so the theme is applied. Failing the whole
      // request here would tell the user it did not work when it visibly did.
      console.error("Theme cookie set but the user row did not update");
    }
  }

  return NextResponse.json({ ok: true });
}

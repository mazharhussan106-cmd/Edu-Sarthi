// (Named proxy.ts since Next 16 renamed the middleware convention; it behaves
// the same. Next now runs it on Node by default, but it still imports only
// lib/auth.config so nothing here depends on that.)
//
// Owns route protection: who is signed in, whether their email is verified,
// and whether their role may see the path. Runs before the page renders, so a
// blocked user never triggers the page's queries.
//
// It deliberately imports lib/auth.config, NOT lib/auth. Middleware runs on the
// Edge runtime; the full config pulls in Prisma and bcrypt, neither of which
// loads there.
//
// It deliberately does NOT read the database. Everything it checks comes from
// the JWT — a query per request would defeat the point of JWT sessions.

import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

// Reachable signed out. Prefix match, so /legal/privacy and
// /reset-password/<token> are covered by their parents.
const PUBLIC_PREFIXES = [
  // Link-shared flashcard decks: possession of the link is the permission.
  "/d",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/about",
  "/support",
  "/legal",
  "/suspended",
];

function isPublic(path: string): boolean {
  if (path === "/") return true;
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

/// Single source of truth for "where does this role belong". Used on sign-in,
/// after verification, and whenever a role hits a path it may not see.
function homeFor(role: string | undefined): string {
  if (role === "ADMIN") return "/admin";
  return role === "TEACHER" ? "/queue" : "/dashboard";
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  const redirect = (to: string) =>
    NextResponse.redirect(new URL(to, req.nextUrl.origin));

  if (!user) {
    if (isPublic(pathname)) return NextResponse.next();
    return redirect("/login");
  }

  // Signed in but unverified: the account exists and cannot be used. Held at
  // /verify rather than signed out, because verifying needs a session.
  if (!user.emailVerified) {
    if (pathname === "/verify") return NextResponse.next();
    // Public marketing pages stay readable — only the app is gated.
    if (isPublic(pathname) && pathname !== "/login" && pathname !== "/register") {
      return NextResponse.next();
    }
    return redirect("/verify");
  }

  // Verified users have no business on the auth pages. Without this, the back
  // button after signing in lands on a login form for an account already
  // signed in.
  if (
    pathname === "/verify" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password"
  ) {
    return redirect(homeFor(user.role));
  }

  const isTeacherArea =
    pathname.startsWith("/queue") ||
    pathname.startsWith("/review") ||
    pathname.startsWith("/students") ||
    pathname.startsWith("/workload");

  if (isTeacherArea && user.role === "STUDENT") {
    return redirect("/dashboard");
  }

  // Admin pages are admin-only. The API routes behind them re-check the role
  // against the database, since a JWT can outlive a demotion.
  if (pathname.startsWith("/admin") && user.role !== "ADMIN") {
    return redirect(homeFor(user.role));
  }

  return NextResponse.next();
});

export const config = {
  // Everything except Next's internals, every API route, and files with an
  // extension. All of /api is excluded, not just /api/auth: a signed-out
  // POST /api/register was being redirected to /login, so the browser got
  // HTML where it expected JSON. Every route handler checks its own session.
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

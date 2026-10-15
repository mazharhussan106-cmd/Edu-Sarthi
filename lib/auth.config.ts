// Owns the Edge-safe half of the auth config: callbacks, pages, session
// strategy. Middleware imports THIS, never lib/auth.ts.
//
// It deliberately imports no Prisma, no bcrypt, and no provider that needs
// them. Middleware runs on the Edge runtime where those cannot load — pulling
// the full config in is what makes middleware fail at build or on every
// request.

import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  // JWT, not database sessions. Every database-session read is a query, which
  // on serverless means a pooled connection per page load. JWTs verify
  // in-process.
  // 7 days, not Auth.js's 30: a suspended or deleted account's token is useless
  // sooner, and API routes re-check the database as well (lib/apiUser).
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [], // filled in by lib/auth.ts, which runs on Node

  callbacks: {
    async jwt({ token, user }) {
      // `user` is present only on the sign-in call. On every later request the
      // token already carries these, so copying unconditionally would wipe them.
      if (user) {
        token.role = user.role;
        token.emailVerified = user.emailVerified;
        // Stamped once, at sign-in, and never refreshed. The JWT's own `iat`
        // moves forward every time Auth.js re-issues the cookie, which would
        // let a signed-out device slip back in as "newly issued".
        token.loginAt = Date.now();
      }

      // After verifying an email the JWT is stale, and the client calls
      // update() to refresh it. The payload it sends is NEVER trusted: it is
      // whatever the browser chose to send, so reading emailVerified from it
      // would let anyone mark their own address as verified. lib/auth.ts, which
      // can reach the database, re-reads the truth on an update instead.
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role;
        session.user.emailVerified = token.emailVerified;
        session.user.loginAt = token.loginAt;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;

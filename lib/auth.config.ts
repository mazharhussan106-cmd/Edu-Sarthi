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
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [], // filled in by lib/auth.ts, which runs on Node

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // `user` is present only on the sign-in call. On every later request the
      // token already carries these, so copying unconditionally would wipe them.
      if (user) {
        token.role = user.role;
        token.emailVerified = user.emailVerified;
      }

      // After verifying an email the JWT is stale — the client calls
      // update() and this refreshes it without a full sign-out.
      //
      // `session` here is whatever the client passed to update(), so it is
      // untyped by design. Parsed into a Date rather than cast: a client that
      // sends nonsense should leave the token unchanged, not poison it.
      if (trigger === "update") {
        const raw = (session as { emailVerified?: unknown } | undefined)
          ?.emailVerified;

        if (typeof raw === "string" || raw instanceof Date) {
          const parsed = new Date(raw);
          if (!Number.isNaN(parsed.getTime())) token.emailVerified = parsed;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role;
        session.user.emailVerified = token.emailVerified;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;

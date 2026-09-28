// Owns the full auth setup: the Credentials provider, password checking, and
// the exported auth()/signIn()/signOut() helpers. Node runtime only.
//
// It deliberately does NOT get imported by middleware — see lib/auth.config.ts.
// Importing this file anywhere Edge-bound pulls in Prisma and bcrypt and fails.

import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import {
  clearLoginAttempts,
  isRateLimited,
  recordFailedLogin,
} from "@/lib/loginRateLimit";

// NextAuth v5 surfaces `code` in the redirect URL, which is how the login page
// tells these apart without the server sending a message string.
class InvalidCredentials extends CredentialsSignin {
  code = "credentials";
}
class TooManyAttempts extends CredentialsSignin {
  code = "throttled";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) throw new InvalidCredentials();

        const { email, password } = parsed.data;

        // Before the lookup and before bcrypt, on purpose. bcrypt at cost 12
        // takes ~100ms; letting an attacker trigger it without limit is a
        // free CPU-exhaustion attack on every other request in the process.
        if (await isRateLimited(email)) throw new TooManyAttempts();

        const user = await prisma.user.findUnique({ where: { email } });

        // Identical failure for "no such account" and "wrong password". A
        // different message for each tells an attacker which addresses are
        // registered, which is half of a credential-stuffing attack.
        if (!user?.passwordHash) {
          await recordFailedLogin(email);
          throw new InvalidCredentials();
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          await recordFailedLogin(email);
          throw new InvalidCredentials();
        }

        await clearLoginAttempts(email);

        // Unverified accounts sign in and are then held at /verify by
        // middleware. Blocking here would leave the user with no session and
        // nothing to verify against — and at this point they have already
        // proven they know the password, so "verify your email" reveals
        // nothing they did not already know.
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
});

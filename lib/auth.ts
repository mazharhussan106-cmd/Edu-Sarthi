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
import { emailCodeSchema, emailLinkSchema, loginSchema } from "@/lib/validations";
import { redeemCode, redeemLink, userForProvenEmail } from "@/lib/emailLogin";
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
class BadEmailCode extends CredentialsSignin {
  code = "email-code";
}
class Suspended extends CredentialsSignin {
  code = "suspended";
}

// Every provider ends here, so this is the one place a suspended account is
// refused — after the credential check, so the message reveals nothing to
// someone who does not already know the password or own the inbox.
function sessionUser(user: {
  id: string;
  name: string | null;
  email: string | null;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  emailVerified: Date | null;
  suspendedAt: Date | null;
}) {
  if (user.suspendedAt) throw new Suspended();
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    // On update() the browser's payload is ignored; the account's own row is
    // the only source for "verified" and for the role.
    async jwt(params) {
      const token = await authConfig.callbacks.jwt(params);
      if (params.trigger === "update" && token.sub) {
        const row = await prisma.user.findUnique({ where: { id: token.sub }, select: { emailVerified: true, role: true } });
        if (row) {
          token.emailVerified = row.emailVerified;
          token.role = row.role;
        }
      }
      return token;
    },
  },
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
        return sessionUser(user);
      },
    }),

    // Passwordless: the six-digit code typed from the email. Shares the
    // password login's throttle, so switching methods buys no extra guesses.
    Credentials({
      id: "email-code",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      async authorize(raw) {
        const parsed = emailCodeSchema.safeParse(raw);
        if (!parsed.success) throw new BadEmailCode();

        const { email, code } = parsed.data;
        if (await isRateLimited(email)) throw new TooManyAttempts();

        const redeemed = await redeemCode(email, code);
        if (!redeemed) {
          await recordFailedLogin(email);
          throw new BadEmailCode();
        }

        await clearLoginAttempts(email);
        return sessionUser(await userForProvenEmail(redeemed.email));
      },
    }),

    // Passwordless: the one-tap link from the same email. No throttle — the
    // token is 32 random bytes, so there is nothing to guess.
    Credentials({
      id: "email-link",
      credentials: { token: { label: "Token", type: "text" } },
      async authorize(raw) {
        const parsed = emailLinkSchema.safeParse(raw);
        if (!parsed.success) throw new BadEmailCode();

        const redeemed = await redeemLink(parsed.data.token);
        if (!redeemed) throw new BadEmailCode();

        return sessionUser(await userForProvenEmail(redeemed.email));
      },
    }),
  ],
});

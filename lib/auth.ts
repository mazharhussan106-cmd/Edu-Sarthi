// Owns the full auth setup: the Credentials provider, password checking, and
// the exported auth()/signIn()/signOut() helpers. Node runtime only.
//
// It deliberately does NOT get imported by middleware — see lib/auth.config.ts.
// Importing this file anywhere Edge-bound pulls in Prisma and bcrypt and fails.

import NextAuth, { CredentialsSignin } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { emailCodeSchema, emailLinkSchema, loginSchema } from "@/lib/validations";
import { redeemCode, redeemLink, userForProvenEmail } from "@/lib/emailLogin";
import { createGuestUser } from "@/lib/guest";
import { checkDoor, checkStaffDoorAccount } from "@/lib/doorAuth";
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
class GuestBusy extends CredentialsSignin {
  code = "guest-busy";
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
  isGuest: boolean;
}) {
  if (user.suspendedAt) throw new Suspended();
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    isGuest: user.isGuest,
  };
}

// When a Google sign-in finds a session already in the browser, Auth.js links
// the Google account to that session's user instead of the one with the
// email. A guest is allowed on /login to upgrade, so a guest pressing
// "Continue with Google" had the Google account linked to the guest row, and
// every Google sign-in after that came back as the guest. The email alone
// decides whose account it is (signIn below), so Auth.js is never told who is
// signed in. It asks getUser for nothing else here (it is also used by
// passkeys, which this site does not have).
const adapter: Adapter = { ...PrismaAdapter(prisma), getUser: async () => null };

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    // Google only. Everything about who the person is comes from our own row,
    // never from Google's profile: the account is found or made by
    // userForProvenEmail, the same function the email code uses, so the two
    // paths cannot disagree about a password set by a pre-registrant.
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;

      const email = typeof profile?.email === "string" ? profile.email.trim().toLowerCase() : "";
      // Linking by email is only safe when Google says it checked the inbox.
      if (!email || profile?.email_verified !== true) return false;

      const user = await userForProvenEmail(email);
      if (user.suspendedAt) return false;

      // Repairs links the bug above already made: a Google account stuck on a
      // guest row moves to its email's account before Auth.js looks it up.
      await prisma.account.updateMany({
        where: { provider: "google", providerAccountId: account.providerAccountId, user: { isGuest: true } },
        data: { userId: user.id },
      });

      if (!user.name && typeof profile.name === "string" && profile.name.trim()) {
        await prisma.user.update({ where: { id: user.id }, data: { name: profile.name.trim().slice(0, 80) } });
      }
      return true;
    },
    // On update() the browser's payload is ignored; the account's own row is
    // the only source for "verified", the role and "guest".
    async jwt(params) {
      const token = await authConfig.callbacks.jwt(params);
      if (params.trigger === "update" && token.sub) {
        const row = await prisma.user.findUnique({ where: { id: token.sub }, select: { emailVerified: true, role: true, isGuest: true } });
        if (row) {
          token.emailVerified = row.emailVerified;
          token.role = row.role;
          // A guest who adds an email becomes a full account in place.
          token.isGuest = row.isGuest;
        }
      }
      return token;
    },
  },
  adapter,
  providers: [
    // Present only when both keys are set, so the site still builds and runs
    // before Google is configured; the login page asks /api/auth/providers
    // and shows the button only if this is here.
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            // Safe here because signIn() above only lets verified Google
            // emails through and has already dealt with any older password.
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),

    // "Continue as guest". Takes no input: it makes a study-only account.
    Credentials({
      id: "guest",
      credentials: {},
      async authorize() {
        const guest = await createGuestUser();
        if (!guest) throw new GuestBusy();
        return sessionUser(guest);
      },
    }),

    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        portal: { label: "Door", type: "text" },
      },

      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) throw new InvalidCredentials();

        const { email, password, portal } = parsed.data;

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

        // The sign-in door (lib/doorAuth), before the attempt counter is
        // cleared: a refusal at the admin door must keep counting.
        await checkDoor(portal, user.role, email, "password");
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
        portal: { label: "Door", type: "text" },
      },
      async authorize(raw) {
        const parsed = emailCodeSchema.safeParse(raw);
        if (!parsed.success) throw new BadEmailCode();

        const { email, code, portal } = parsed.data;
        if (await isRateLimited(email)) throw new TooManyAttempts();

        const redeemed = await redeemCode(email, code);
        if (!redeemed) {
          await recordFailedLogin(email);
          throw new BadEmailCode();
        }

        // Staff doors admit existing accounts of their role only, and never
        // make one; the student door makes one for a new address.
        await checkStaffDoorAccount(portal, redeemed.email);
        await clearLoginAttempts(email);
        return sessionUser(await userForProvenEmail(redeemed.email));
      },
    }),

    // Passwordless: the one-tap link from the same email. No throttle — the
    // token is 32 random bytes, so there is nothing to guess.
    Credentials({
      id: "email-link",
      credentials: { token: { label: "Token", type: "text" }, portal: { label: "Door", type: "text" } },
      async authorize(raw) {
        const parsed = emailLinkSchema.safeParse(raw);
        if (!parsed.success) throw new BadEmailCode();

        const redeemed = await redeemLink(parsed.data.token);
        if (!redeemed) throw new BadEmailCode();

        await checkStaffDoorAccount(parsed.data.portal, redeemed.email);
        return sessionUser(await userForProvenEmail(redeemed.email));
      },
    }),
  ],
});

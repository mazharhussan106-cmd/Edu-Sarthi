// Owns the type augmentation that puts `role` and `emailVerified` on the
// session and the JWT. Without this, session.user.role is a type error even
// though the callback in lib/auth.config.ts sets it at runtime.
//
// It deliberately declares nothing else. This file has no runtime output — it
// only teaches TypeScript what the callbacks already do.

import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      emailVerified: Date | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    emailVerified: Date | null;
  }
}

// Auth.js v5 defines JWT in @auth/core/jwt and next-auth/jwt only re-exports
// it. Augmenting just the re-export leaves token.role typed as unknown, so
// both modules get the same declaration.
declare module "@auth/core/jwt" {
  interface JWT {
    role: Role;
    emailVerified: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    emailVerified: Date | null;
  }
}

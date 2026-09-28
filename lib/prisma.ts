// Owns the single PrismaClient instance the whole app shares. Nothing else may
// call `new PrismaClient()` — every query imports from here.
//
// It deliberately does NOT wrap queries, add helpers, or hold business logic.
// It is a connection, not a data layer.

import { PrismaClient } from "@prisma/client";

// Dev hot-reload re-evaluates modules on every save. Without stashing the
// client on globalThis, each save leaks a new one, and after twenty edits the
// database is refusing connections for reasons that look nothing like the
// change you just made.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Queries are noisy and drown the useful output; warnings and errors are
    // the ones worth seeing while developing.
    log:
      process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// Not cached in production: each serverless invocation is its own process, so
// there is no reload to survive, and holding a reference only delays teardown.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Owns the NextAuth HTTP endpoints. The handlers are built in lib/auth.ts;
// this file only mounts them.
//
// It deliberately contains no logic. Anything added here runs on every auth
// request including the ones NextAuth makes internally.

import { handlers } from "@/lib/auth";

// NextAuth v5 returns a `handlers` object, not bare GET/POST exports.
// Re-exporting names it does not have fails the build, not just the request.
export const { GET, POST } = handlers;

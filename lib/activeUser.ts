// Owns turning away accounts whose session outlived a change an admin made:
// a suspension, or a role taken away.
//
// Sign-in already refuses a suspended account, but a JWT issued earlier stays
// valid until it expires, and it carries the role it was issued with. Every
// signed-in layout calls this, so both changes take effect on the next page
// load instead of weeks later.
//
// One primary-key read per page. Middleware cannot do this — it runs on the
// Edge with no database — which is why it lives in the layouts.

import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function ensureActiveUser(allowed?: readonly Role[]): Promise<void> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return;
  const row = await prisma.user.findUnique({ where: { id }, select: { suspendedAt: true, role: true } });
  // A deleted account and a suspended one are both sent out the same way.
  if (!row || row.suspendedAt) redirect("/suspended");
  if (allowed && !allowed.includes(row.role)) {
    redirect(row.role === "ADMIN" ? "/admin" : row.role === "TEACHER" ? "/queue" : "/dashboard");
  }
}

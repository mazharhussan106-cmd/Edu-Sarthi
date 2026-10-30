// Owns who each sign-in door lets in (docs/LOGIN-DOORS-PLAN.md), checked on
// the server after the password, code or link has been proven:
//   student door (/login)        → everyone; staff get a note (DoorNote)
//   teacher door (/teacher/login) → teachers and admins; a student is told to
//                                   use the main sign-in page
//   admin door (/admin/login)    → admins only; anyone else gets the same
//                                   answer as a wrong password, and it counts
//                                   as a failed attempt, so the door never
//                                   confirms that an admin account exists
// The staff doors never create an account: they admit existing ones only.
//
// It deliberately does NOT check the password or the code (lib/auth.ts does,
// before calling this) and does not guard pages (proxy.ts does).

import { CredentialsSignin } from "next-auth";

import { prisma } from "@/lib/prisma";
import { recordFailedLogin } from "@/lib/loginRateLimit";
import type { Portal, PortalRole } from "@/lib/portals";

class DoorForStudents extends CredentialsSignin {
  code = "door-student";
}
// The same codes lib/auth.ts uses for a wrong password and a wrong code, so
// the admin door's refusal is indistinguishable from them.
class LooksLikeWrongPassword extends CredentialsSignin {
  code = "credentials";
}
class LooksLikeWrongCode extends CredentialsSignin {
  code = "email-code";
}

export function doorAdmits(portal: Portal, role: PortalRole): boolean {
  if (portal === "student") return true;
  if (portal === "teacher") return role === "TEACHER" || role === "ADMIN";
  return role === "ADMIN";
}

/// Throws the door's refusal when `role` may not use it.
export async function checkDoor(portal: Portal, role: PortalRole, email: string, method: "password" | "code"): Promise<void> {
  if (doorAdmits(portal, role)) return;
  if (portal === "admin") {
    await recordFailedLogin(email);
    throw method === "password" ? new LooksLikeWrongPassword() : new LooksLikeWrongCode();
  }
  throw new DoorForStudents();
}

/// For a code or link redeemed at a staff door: the account must already
/// exist and be one this door admits, or it is refused like a wrong code.
/// The student door makes accounts (lib/emailLogin userForProvenEmail).
export async function checkStaffDoorAccount(portal: Portal, email: string): Promise<void> {
  if (portal === "student") return;
  const existing = await prisma.user.findUnique({ where: { email }, select: { role: true } });
  if (!existing) throw new LooksLikeWrongCode();
  await checkDoor(portal, existing.role, email, "code");
}

/// Whether a staff door should email a sign-in code to this address. The
/// route answers the same either way, so the page reveals nothing.
export async function staffDoorMaySend(portal: Portal, email: string): Promise<boolean> {
  if (portal === "student") return true;
  const existing = await prisma.user.findUnique({ where: { email }, select: { role: true, suspendedAt: true } });
  return !!existing && !existing.suspendedAt && doorAdmits(portal, existing.role);
}

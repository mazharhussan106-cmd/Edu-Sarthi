// Owns the three sign-in doors (docs/LOGIN-DOORS-PLAN.md): their addresses,
// which role each admits, what each page says, and the wording when a door
// refuses someone. /login stays the student door, so every older link to it
// still works.
//
// It deliberately imports nothing from Prisma or Auth.js, so proxy.ts and the
// sign-in form can both use it, and it enforces nothing: the role check is
// lib/doorAuth.ts, page protection is proxy.ts. A door is a convenience, not a
// security boundary; the role pages are guarded by the session whichever door
// was used.

export const PORTALS = ["student", "teacher", "admin"] as const;
export type Portal = (typeof PORTALS)[number];
export type PortalRole = "STUDENT" | "TEACHER" | "ADMIN";

export const PORTAL_ROLE: Record<Portal, PortalRole> = { student: "STUDENT", teacher: "TEACHER", admin: "ADMIN" };

export const PORTAL_PATH: Record<Portal, string> = { student: "/login", teacher: "/teacher/login", admin: "/admin/login" };

/// The staff doors are pages a signed-out person may open (proxy.ts).
export const STAFF_DOOR_PATHS: readonly string[] = [PORTAL_PATH.teacher, PORTAL_PATH.admin];

/// Anything that is not a known door is the student door. The value comes from
/// a form field or a link, so it is never trusted to be valid.
export function parsePortal(value: unknown): Portal {
  return PORTALS.find((p) => p === value) ?? "student";
}

export const PORTAL_COPY: Record<Portal, { title: string; intro: string }> = {
  student: { title: "Sign in", intro: "New here? Enter your email — the same code creates your account." },
  teacher: { title: "Teacher sign in", intro: "For EduSarthi teachers. Teacher accounts are not created here." },
  admin: { title: "Admin sign in", intro: "Authorised staff only." },
};

/// Set by the student door's form just before signing in, read by the staff
/// layouts (DoorNote): a teacher or admin who came in that way is told, once,
/// where their own door is. Not a security cookie; deleting it changes nothing
/// but the note.
export const STUDENT_DOOR_COOKIE = "es-door";

/// The message for a failed sign-in, by the `code` Auth.js hands back. One
/// function so the three doors cannot drift apart. The admin door is never
/// named here: a refusal at it reads like a wrong password (lib/doorAuth).
export function signInError(code: string | undefined, method: "password" | "code"): string {
  if (code === "throttled") return "Too many attempts. Wait a few minutes and try again.";
  if (code === "suspended") return "This account is suspended. Email support@edusarthi.com for help.";
  if (code === "door-student") return "This is the teacher sign-in. Students sign in on the main sign-in page.";
  // Identical wording for a wrong email and a wrong password: telling them
  // apart would confirm which addresses have accounts.
  return method === "password" ? "Email or password is not correct." : "That code is not right or has expired. Check the email, or send a new one.";
}

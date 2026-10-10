// Owns the three sign-in doors (student, teacher, admin): their URLs, which
// role each one admits, and the wording shown when a door refuses someone.
//
// It deliberately imports nothing from Prisma or Auth.js, so proxy.ts (Edge)
// and the client form can both use it. It also does NOT enforce anything: the
// role check lives in lib/auth.ts, and page protection stays in proxy.ts.
// A door is a convenience for the person signing in, not a security boundary
// — the role pages are guarded by the JWT whichever door was used.

export const PORTALS = ["student", "teacher", "admin"] as const;
export type Portal = (typeof PORTALS)[number];
export type PortalRole = "STUDENT" | "TEACHER" | "ADMIN";

export const PORTAL_ROLE: Record<Portal, PortalRole> = {
  student: "STUDENT",
  teacher: "TEACHER",
  admin: "ADMIN",
};

export const PORTAL_PATH: Record<Portal, string> = {
  student: "/student/login",
  teacher: "/teacher/login",
  admin: "/admin/login",
};

/// Anything that is not a known door falls back to the student one. The value
/// comes from a query string or a form field, so it is never trusted to be valid.
export function parsePortal(value: unknown): Portal {
  return PORTALS.find((p) => p === value) ?? "student";
}

export const PORTAL_COPY: Record<Portal, { title: string; intro: string }> = {
  student: {
    title: "Student sign in",
    intro: "New here? Enter your email — the same code creates your account.",
  },
  teacher: {
    title: "Teacher sign in",
    intro: "For EduSarthi teachers. Teacher accounts are not created on this page.",
  },
  admin: {
    title: "Admin sign in",
    intro: "Restricted. Authorised staff only.",
  },
};

/// The text for a failed sign-in, keyed by the `code` Auth.js hands back.
/// One function so the three doors cannot drift apart.
///
/// The admin account is never named with a URL to anyone who is not already on
/// the admin door: telling a student where the admin sign-in lives would undo
/// keeping it unlinked.
export function signInErrorMessage(
  code: string | undefined,
  method: "code" | "password",
): string {
  switch (code) {
    case "throttled":
      return "Too many attempts. Wait a few minutes and try again.";
    case "suspended":
      return "This account is suspended. Email support@edusarthi.com for help.";
    case "portal-student":
      return `This is a student account. Sign in on the student page: ${PORTAL_PATH.student}`;
    case "portal-teacher":
      return `This is a teacher account. Sign in on the teacher page: ${PORTAL_PATH.teacher}`;
    case "portal-admin":
      return "This is an admin account. Use the admin sign-in page you were given.";
    case "email-code":
      return "That code is not right or has expired. Check the email, or send a new one.";
    default:
      // Same wording for a wrong email and a wrong password. Telling them
      // apart would confirm which addresses have accounts.
      return method === "code"
        ? "That code is not right or has expired. Check the email, or send a new one."
        : "Email or password is not correct.";
  }
}

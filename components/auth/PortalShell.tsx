// Owns the look of each sign-in door: the page background, the header and the
// framing around the form. Three deliberately different faces so a person can
// tell at a glance which door they are standing at.
//
// It deliberately does NOT contain the form (PortalLogin) or any sign-in rule.
// Every colour is a token. The form always sits on a `surface` card, so inputs
// keep their contrast on every theme even when the page behind is dark.

import Link from "next/link";

import type { Portal } from "@/lib/portals";

const FRAME: Record<Portal, string> = {
  // Warm and open: the page is the paper colour with a saffron edge.
  student: "bg-paper",
  // Calm and orderly: a quiet tinted page.
  teacher: "bg-paper-dim",
  // Heavy and plain: the dark player colour, no decoration.
  admin: "bg-player-bg",
};

const BADGE: Record<Portal, { label: string; className: string }> = {
  student: { label: "Student", className: "bg-saffron text-on-saffron" },
  teacher: { label: "Teacher", className: "bg-accent text-on-accent" },
  admin: { label: "Admin", className: "border border-player-text text-player-text" },
};

export function PortalShell({
  portal,
  children,
}: Readonly<{ portal: Portal; children: React.ReactNode }>) {
  const dark = portal === "admin";

  return (
    <div className={`min-h-dvh ${FRAME[portal]}`}>
      {portal === "student" ? (
        <div aria-hidden className="h-2 w-full bg-saffron" />
      ) : null}

      <main className="mx-auto max-w-sm px-6 py-12">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className={`font-display text-xl font-bold ${
              dark ? "text-player-text" : "text-brand hover:text-accent"
            }`}
          >
            EduSarthi
          </Link>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${BADGE[portal].className}`}
          >
            {BADGE[portal].label}
          </span>
        </header>

        <div
          className={`mt-8 rounded-2xl bg-surface p-6 shadow-sm ${
            portal === "teacher"
              ? "border border-border-strong border-l-4 border-l-accent"
              : "border border-border"
          }`}
        >
          {children}
        </div>

        {portal === "student" ? (
          <p className="mt-6 text-center text-xs text-ink-muted">
            Are you a teacher?{" "}
            <Link href="/teacher/login" className="font-medium text-accent hover:underline">
              Teacher sign in
            </Link>
          </p>
        ) : null}
        {portal === "teacher" ? (
          <p className="mt-6 text-center text-xs text-ink-muted">
            Are you a student?{" "}
            <Link href="/student/login" className="font-medium text-accent hover:underline">
              Student sign in
            </Link>
          </p>
        ) : null}
        {dark ? (
          <p className="mt-6 text-center text-xs text-player-text">
            This page is for EduSarthi staff only. If that is not you, go back to the home page.
          </p>
        ) : null}
      </main>
    </div>
  );
}

// Owns the landing page for the one-tap sign-in link in the login email.
//
// It deliberately waits for a button press instead of signing in on load.
// Mail scanners and link previews open every URL in an email; signing in on
// load would let the scanner spend the one-time token before the student
// ever taps it. The link carries its sign-in door (?portal=, lib/portals), and
// the server checks that door's role again.

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { getSession, signIn } from "next-auth/react";

import { Button } from "@/components/ui/Button";
import { markStudentDoor } from "@/components/auth/doorCookie";
import { PORTAL_PATH, parsePortal } from "@/lib/portals";

function LinkSignIn() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const portal = parsePortal(params.get("portal"));
  const [error, setError] = useState<string | null>(
    token ? null : "This link is incomplete. Open it again from the email.",
  );
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    setError(null);
    markStudentDoor(portal);
    const result = await signIn("email-link", { token, portal, redirect: false });
    if (result?.error) {
      setError("This link has expired or was already used. Ask for a new one on the sign-in page.");
      setBusy(false);
      return;
    }
    const session = await getSession();
    const role = session?.user?.role;
    router.push(role === "ADMIN" ? "/admin" : role === "TEACHER" ? "/queue" : "/dashboard");
    router.refresh();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Sign in to EduSarthi</h1>
      <p className="mt-1 text-sm text-ink-muted">One tap and you are in.</p>

      {error ? (
        <p role="alert" aria-live="assertive" className="mt-5 text-xs text-error">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3">
        <Button onClick={() => void go()} disabled={busy || !token}>
          {busy ? "Signing in…" : "Continue"}
        </Button>
        <Link href={PORTAL_PATH[portal]} className="text-xs text-ink-muted hover:text-accent">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

export default function LoginLinkPage() {
  // useSearchParams needs a Suspense boundary, or the whole route opts out of
  // static rendering with a build error.
  return (
    <Suspense>
      <LinkSignIn />
    </Suspense>
  );
}

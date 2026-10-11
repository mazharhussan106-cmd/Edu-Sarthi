// Owns the two extra ways in under the login and register forms: "Continue
// with Google" and "Continue as guest".
//
// It deliberately does NOT decide who may do what afterwards. Google sign-in
// lands on /login and the proxy sends each role to its own home; a guest is
// an ordinary student row flagged isGuest, and the API routes that a guest
// must not reach refuse it (lib/apiUser.ts). This component only starts the
// sign-in.

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";

import { Button } from "@/components/ui/Button";

// Auth.js sends the user back to /login?error=<code> when Google sign-in is
// refused. Each message says what to do next.
const GOOGLE_ERRORS: Record<string, string> = {
  AccessDenied:
    "That Google account could not sign in. It may be suspended, or Google did not confirm its email. Use an email code instead.",
  Configuration: "Google sign-in is not set up yet. Use an email code instead.",
};

export function SocialSignIn() {
  const router = useRouter();
  const [googleOn, setGoogleOn] = useState(false);
  const [busy, setBusy] = useState<"google" | "guest" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    // Asks the server which providers are configured, so the Google button
    // appears only when its keys are set.
    getProviders()
      .then((p) => {
        if (alive) setGoogleOn(!!p?.google);
      })
      .catch(() => {});

    // Read here rather than with useSearchParams, which would force a Suspense
    // boundary around the whole login page.
    const code = new URLSearchParams(window.location.search).get("error");
    if (code && code !== "CredentialsSignin") {
      setError(GOOGLE_ERRORS[code] ?? "Google sign-in did not work. Try again, or use an email code.");
    }
    return () => {
      alive = false;
    };
  }, []);

  async function google() {
    setError(null);
    setBusy("google");
    // Back to /login, which the proxy redirects to the right home for the
    // role. The page needs no role logic of its own.
    await signIn("google", { redirectTo: "/login" });
    setBusy(null);
  }

  async function guest() {
    setError(null);
    setBusy("guest");
    const result = await signIn("guest", { redirect: false });
    if (result?.error) {
      setError(
        result.code === "guest-busy"
          ? "Guest access is busy right now. Try again in a few minutes, or sign in with an email code."
          : "Could not start a guest session. Try again, or sign in with an email code.",
      );
      setBusy(null);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 text-xs text-ink-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {googleOn ? (
          <Button variant="outline" onClick={() => void google()} disabled={busy !== null}>
            {busy === "google" ? "Opening Google…" : "Continue with Google"}
          </Button>
        ) : null}
        <Button variant="outline" onClick={() => void guest()} disabled={busy !== null}>
          {busy === "guest" ? "Starting…" : "Continue as guest"}
        </Button>
      </div>

      {error ? (
        <p role="alert" aria-live="assertive" className="mt-3 text-xs text-error">
          {error}
        </p>
      ) : null}

      <p className="mt-3 text-xs text-ink-muted">
        Guests can study the flashcards. Recordings, decks and teacher audits need an account.
      </p>
    </div>
  );
}

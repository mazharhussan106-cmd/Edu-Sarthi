// Owns the sign-in form every door shares (lib/portals): /login for students,
// /teacher/login and /admin/login for staff. Two ways in: a six-digit code
// sent to the email (CodeSignIn, the default) or email and password. The
// student door also has Google and guest (SocialSignIn) and the link to create
// an account; the staff doors have neither, by the owner's decision of 30 Oct.
//
// It deliberately does NOT decide who a door admits (lib/doorAuth on the
// server) or where to send the user after sign-in: that comes from the
// session, so the rule lives in one place.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSession, signIn } from "next-auth/react";

import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { CodeSignIn, EmailField } from "@/components/auth/CodeSignIn";
import { markStudentDoor } from "@/components/auth/doorCookie";
import { SocialSignIn } from "@/components/auth/SocialSignIn";
import { PORTAL_COPY, signInError, type Portal } from "@/lib/portals";
import { loginSchema } from "@/lib/validations";

type Method = "code" | "password";

export function PortalLogin({ portal }: { portal: Portal }) {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("code");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const copy = PORTAL_COPY[portal];

  async function goHome() {
    // Read the session rather than guessing: the role decides the landing
    // page, and the JWT is the only thing that knows it.
    const session = await getSession();
    const role = session?.user?.role;
    if (!session?.user?.emailVerified) router.push("/verify");
    else router.push(role === "ADMIN" ? "/admin" : role === "TEACHER" ? "/queue" : "/dashboard");
    router.refresh();
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Same schema the server enforces. This only saves a round trip — the
    // server never trusts that this ran.
    const parsed = loginSchema.safeParse({ email, password, portal });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details.");
      return;
    }
    setBusy(true);
    markStudentDoor(portal);
    const result = await signIn("credentials", { ...parsed.data, redirect: false });
    if (result?.error) {
      setError(signInError(result.code, "password"));
      setBusy(false);
      return;
    }
    await goHome();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">{copy.title}</h1>
      <p className="mt-1 text-sm text-ink-muted">{copy.intro}</p>

      <SegmentedControl
        label="Sign in with"
        className="mt-6"
        options={[
          { value: "code", label: "Email code" },
          { value: "password", label: "Password" },
        ]}
        value={method}
        onValueChange={(m) => {
          setMethod(m);
          setError(null);
        }}
      />

      {method === "code" ? (
        <CodeSignIn portal={portal} email={email} setEmail={setEmail} onSignedIn={goHome} />
      ) : (
        <form onSubmit={submitPassword} className="mt-5 flex flex-col gap-4">
          <EmailField email={email} onChange={setEmail} invalid={!!error} />
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error ? (
            // assertive: the user has just pressed a button and is waiting on
            // the result, so interrupting is the correct behaviour here.
            <p role="alert" aria-live="assertive" className="text-xs text-error">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
          <Link href="/forgot-password" className="text-xs text-ink-muted hover:text-accent">
            Forgot your password?
          </Link>
        </form>
      )}

      {portal === "student" ? (
        <>
          <SocialSignIn />
          <p className="mt-6 text-xs text-ink-muted">
            Prefer a password?{" "}
            <Link href="/register" className="font-medium text-accent hover:underline">
              Create an account with one
            </Link>
          </p>
        </>
      ) : null}
    </div>
  );
}

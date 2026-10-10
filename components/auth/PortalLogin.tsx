// Owns the sign-in form shared by the student, teacher and admin doors: an
// emailed six-digit code, or email and password.
//
// It deliberately does NOT decide how a door looks (components/auth/PortalShell
// does) or who a door admits (lib/auth.ts does). The `portal` it sends is a hint
// that can only make sign-in stricter; the landing page after sign-in comes
// from the session's role, so that rule stays in one place.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSession, signIn } from "next-auth/react";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { PORTAL_COPY, signInErrorMessage, type Portal } from "@/lib/portals";
import {
  emailCodeSchema,
  emailLoginRequestSchema,
  loginSchema,
} from "@/lib/validations";

type Method = "code" | "password";

export function PortalLogin({ portal }: { portal: Portal }) {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("code");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Mirrors the server's 60s resend window so the button is visibly disabled
  // instead of failing with a 429 the user has to read.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function goHome() {
    // Read the session rather than guessing: the role decides the landing
    // page, and the JWT is the only thing that knows it.
    const session = await getSession();
    const role = session?.user?.role;
    if (!session?.user?.emailVerified) router.push("/verify");
    else router.push(role === "ADMIN" ? "/admin" : role === "TEACHER" ? "/queue" : "/dashboard");
    router.refresh();
  }

  async function sendCode() {
    setError(null);
    setNotice(null);
    const parsed = emailLoginRequestSchema.safeParse({ email, portal });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/email-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const raw = await res.text();
      let data: { error?: string } = {};
      try {
        data = JSON.parse(raw);
      } catch {
        data = { error: "Something went wrong. Please try again." };
      }
      if (!res.ok) {
        setError(data.error ?? "Could not send the code. Try again.");
      } else {
        setCodeSent(true);
        setCooldown(60);
        setNotice("If this address can sign in here, a code is on its way. Check the inbox and the spam folder.");
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    }
    setBusy(false);
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = emailCodeSchema.safeParse({ email, code, portal });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the code and try again.");
      return;
    }

    setBusy(true);
    const result = await signIn("email-code", { ...parsed.data, redirect: false });
    if (result?.error) {
      setError(signInErrorMessage(result.code, "code"));
      setBusy(false);
      return;
    }
    await goHome();
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
    const result = await signIn("credentials", { ...parsed.data, redirect: false });
    if (result?.error) {
      setError(signInErrorMessage(result.code, "password"));
      setBusy(false);
      return;
    }
    await goHome();
  }

  const emailField = (
    <div>
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          // A code belongs to the address it was sent to. Editing the address
          // after sending would otherwise submit the old code for a new email.
          if (codeSent) setCodeSent(false);
        }}
        aria-invalid={error ? true : undefined}
        required
      />
    </div>
  );

  const errorText = error ? (
    // assertive: the user has just pressed a button and is waiting on the
    // result, so interrupting is the correct behaviour here.
    <p role="alert" aria-live="assertive" className="text-xs text-error">
      {error}
    </p>
  ) : null;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">{PORTAL_COPY[portal].title}</h1>
      <p className="mt-1 text-sm text-ink-muted">{PORTAL_COPY[portal].intro}</p>

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
          setNotice(null);
        }}
      />

      {method === "code" ? (
        <form onSubmit={submitCode} className="mt-5 flex flex-col gap-4">
          {emailField}

          {codeSent ? (
            <div>
              <Label htmlFor="code">6-digit code</Label>
              <Input
                id="code"
                name="code"
                // numeric, not number: a number input strips leading zeros,
                // and a code like 004821 becomes 4821.
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="font-mono tracking-[0.4em]"
                autoFocus
              />
            </div>
          ) : null}

          {errorText}
          {notice ? (
            <p aria-live="polite" className="text-xs text-success">
              {notice}
            </p>
          ) : null}

          {codeSent ? (
            <>
              <Button type="submit" disabled={busy || code.length !== 6}>
                {busy ? "Checking…" : "Sign in"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void sendCode()}
                disabled={busy || cooldown > 0}
              >
                {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
              </Button>
              <p className="text-xs text-ink-muted">
                The email also has a one-tap sign-in link. Open it on this phone
                and you are in without typing the code.
              </p>
            </>
          ) : (
            <Button onClick={() => void sendCode()} disabled={busy}>
              {busy ? "Sending…" : "Email me a code"}
            </Button>
          )}
        </form>
      ) : (
        <form onSubmit={submitPassword} className="mt-5 flex flex-col gap-4">
          {emailField}
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {errorText}
          <Button type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
          <Link href="/forgot-password" className="text-xs text-ink-muted hover:text-accent">
            Forgot your password?
          </Link>
        </form>
      )}

      {portal === "student" ? (
        <p className="mt-6 text-xs text-ink-muted">
          Prefer a password?{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Create an account with one
          </Link>
        </p>
      ) : null}
    </div>
  );
}

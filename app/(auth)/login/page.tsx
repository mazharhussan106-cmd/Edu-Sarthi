// Owns the sign-in screen. Two ways in: a six-digit code sent to the email
// (the default, and the only one a new student needs), or email and password.
//
// It deliberately does NOT decide where to send the user after sign-in. That
// comes from the session, so the rule lives in one place rather than being
// duplicated between here and middleware.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSession, signIn } from "next-auth/react";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  emailCodeSchema,
  emailLoginRequestSchema,
  loginSchema,
} from "@/lib/validations";

type Method = "code" | "password";

export default function LoginPage() {
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
  // instead of failing with a 429 the student has to read.
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
    const parsed = emailLoginRequestSchema.safeParse({ email });
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
        setNotice("Code sent. Check your inbox — and the spam folder.");
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    }
    setBusy(false);
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = emailCodeSchema.safeParse({ email, code });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the code and try again.");
      return;
    }

    setBusy(true);
    const result = await signIn("email-code", { ...parsed.data, redirect: false });
    if (result?.error) {
      setError(
        result.code === "throttled"
          ? "Too many attempts. Wait a few minutes and try again."
          : result.code === "suspended"
            ? "This account is suspended. Email support@edusarthi.com for help."
            : "That code is not right or has expired. Check the email, or send a new one.",
      );
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
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details.");
      return;
    }

    setBusy(true);
    const result = await signIn("credentials", { ...parsed.data, redirect: false });
    if (result?.error) {
      // Identical wording for a wrong email and a wrong password. Telling
      // them apart would confirm which addresses have accounts.
      setError(
        result.code === "throttled"
          ? "Too many attempts. Wait a few minutes and try again."
          : result.code === "suspended"
            ? "This account is suspended. Email support@edusarthi.com for help."
            : "Email or password is not correct.",
      );
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

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Sign in</h1>
      <p className="mt-1 text-sm text-ink-muted">
        New here? Enter your email — the same code creates your account.
      </p>

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

          {error ? (
            <p role="alert" aria-live="assertive" className="text-xs text-error">
              {error}
            </p>
          ) : null}
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

      <p className="mt-6 text-xs text-ink-muted">
        Prefer a password?{" "}
        <Link href="/register" className="font-medium text-accent hover:underline">
          Create an account with one
        </Link>
      </p>
    </div>
  );
}

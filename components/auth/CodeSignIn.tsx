// Owns signing in with a six-digit code from the email, for any sign-in door
// (lib/portals): ask for the code, type it, sign in. Also the email field the
// password form shares.
//
// It deliberately does NOT decide where to go after sign-in (PortalLogin's
// onSignedIn does) or which accounts a door admits (the server does).

"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { markStudentDoor } from "@/components/auth/doorCookie";
import { signInError, type Portal } from "@/lib/portals";
import { emailCodeSchema, emailLoginRequestSchema } from "@/lib/validations";

export function EmailField({ email, onChange, invalid }: { email: string; onChange: (v: string) => void; invalid: boolean }) {
  return (
    <div>
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid ? true : undefined}
        required
      />
    </div>
  );
}

export function CodeSignIn({
  portal,
  email,
  setEmail,
  onSignedIn,
}: {
  portal: Portal;
  email: string;
  setEmail: (v: string) => void;
  onSignedIn: () => Promise<void>;
}) {
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
        // A staff door sends no code to an address it does not admit, and
        // must not say which happened; the student door always sends one.
        setNotice(
          portal === "student"
            ? "Code sent. Check your inbox — and the spam folder."
            : "If this address can sign in here, a code is on its way. Check your inbox — and the spam folder.",
        );
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
    markStudentDoor(portal);
    const result = await signIn("email-code", { ...parsed.data, redirect: false });
    if (result?.error) {
      setError(signInError(result.code, "code"));
      setBusy(false);
      return;
    }
    await onSignedIn();
  }

  return (
    <form onSubmit={submitCode} className="mt-5 flex flex-col gap-4">
      <EmailField
        email={email}
        invalid={!!error}
        onChange={(v) => {
          setEmail(v);
          // A code belongs to the address it was sent to. Editing the address
          // after sending would otherwise submit the old code for a new email.
          if (codeSent) setCodeSent(false);
        }}
      />

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
          <Button variant="ghost" size="sm" onClick={() => void sendCode()} disabled={busy || cooldown > 0}>
            {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
          </Button>
          <p className="text-xs text-ink-muted">
            The email also has a one-tap sign-in link. Open it on this phone and you are in without typing the code.
          </p>
        </>
      ) : (
        <Button onClick={() => void sendCode()} disabled={busy}>
          {busy ? "Sending…" : "Email me a code"}
        </Button>
      )}
    </form>
  );
}

// Owns the reset-request form.
//
// It deliberately shows the same confirmation whether or not the address has
// an account, matching the route handler. A "no account found" message here
// would undo the enumeration protection the server just took care to provide.

"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { forgotPasswordSchema } from "@/lib/validations";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }

    setBusy(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const raw = await res.text();
      let data: { error?: string } = {};
      try {
        data = JSON.parse(raw);
      } catch {
        setError("Something went wrong. Please try again in a moment.");
        setBusy(false);
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "Could not send the link. Please try again.");
        setBusy(false);
        return;
      }

      setSent(true);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    }

    setBusy(false);
  }

  if (sent) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Check your email</h1>
        <p className="mt-2 text-sm text-ink-muted">
          If that email has an account, a reset link is on its way. It works once
          and expires in an hour.
        </p>
        <p className="mt-4 text-xs text-ink-muted">
          Nothing arrived? Check spam, then{" "}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="font-medium text-accent hover:underline"
          >
            try a different email
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Reset password</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Enter your email and we&apos;ll send you a link to set a new password.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={error ? true : undefined}
            required
          />
        </div>

        {error ? (
          <p role="alert" aria-live="assertive" className="text-xs text-error">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={busy}>
          {busy ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="mt-6 text-xs text-ink-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

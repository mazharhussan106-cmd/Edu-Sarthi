// Owns setting a new password from an emailed link.
//
// The token comes from the URL and is never validated here — only the server
// can check it, and pretending otherwise would mean a second lookup that could
// disagree with the one that matters.
//
// After success it does NOT sign the user in. Whoever opened the link may not
// be the account owner; they use the password they just set.

"use client";

import Link from "next/link";
import { use, useState } from "react";

import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { resetPasswordSchema } from "@/lib/validations";

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  // params is a Promise in Next 15+. use() unwraps it in a client component.
  const { token } = use(params);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = resetPasswordSchema.safeParse({
      token,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details.");
      return;
    }

    setBusy(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
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
        setError(data.error ?? "Could not reset the password. Please try again.");
        setBusy(false);
        return;
      }

      setDone(true);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    }

    setBusy(false);
  }

  if (done) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          Password updated
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Sign in with your new password.
        </p>
        <Link href="/login" className="mt-6 inline-block">
          <Button>Go to sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">
        Set a new password
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        Choose something you haven&apos;t used here before.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <PasswordInput
          id="password"
          name="password"
          label="New password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          showStrength
          required
        />

        <div>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm new password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={mismatch || undefined}
            required
          />
          {mismatch ? (
            <p aria-live="polite" className="mt-1 text-xs text-error">
              Passwords do not match
            </p>
          ) : null}
        </div>

        {error ? (
          <p role="alert" aria-live="assertive" className="text-xs text-error">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={busy}>
          {busy ? "Updating…" : "Update password"}
        </Button>
      </form>

      <p className="mt-6 text-xs text-ink-muted">
        Link expired?{" "}
        <Link
          href="/forgot-password"
          className="font-medium text-accent hover:underline"
        >
          Request a new one
        </Link>
      </p>
    </div>
  );
}

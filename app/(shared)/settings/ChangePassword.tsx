// Owns "Change password", in its sheet under Settings → Account & security:
// current password, new password twice, then a sign-out so the next sign-in
// uses the new one. The sheet opens straight on the form; the row already
// asked "Change password?".
//
// It signs this device out as well as the others. The server ends every
// session from the moment the password changes, so staying on this page would
// only fail at the next click with a confusing "signed out" message.
//
// It deliberately does NOT let an account without a password set one here
// (see app/api/profile/password): that goes through Forgot password, which
// proves the person owns the inbox.

"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useOnSheetClosed, useSheetClose } from "@/components/ui/Sheet";
import { changePasswordSchema } from "@/lib/validations";

export function ChangePassword({ hasPassword }: { hasPassword: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const closeSheet = useSheetClose();

  function clear() {
    setError(null);
    setCurrentPassword("");
    setPassword("");
    setConfirmPassword("");
  }
  // Cleared, not kept, however the sheet closes: a half-typed password should
  // not sit in memory on a shared computer, or greet the next person to open it.
  useOnSheetClosed(clear);

  if (!hasPassword) {
    return (
      <p className="text-sm text-ink-muted">
        You sign in with an email code or Google, so this account has no password. To add one, sign
        out and choose Forgot password on the sign-in page. We email you a link to set it.
      </p>
    );
  }

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = changePasswordSchema.safeParse({ currentPassword, password, confirmPassword });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Check the passwords and try again.");

    setBusy(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const raw = await res.text();
      let data: { error?: string } = {};
      try {
        data = JSON.parse(raw);
      } catch {
        setBusy(false);
        return setError("Something went wrong. Nothing was changed. Try again in a moment.");
      }
      if (!res.ok) {
        setBusy(false);
        return setError(data.error ?? "Could not change the password. Try again.");
      }
    } catch {
      setBusy(false);
      return setError("Could not reach the server. Nothing was changed. Check your connection and try again.");
    }

    setDone(true);
    await signOut({ callbackUrl: "/login" });
  }

  if (done) {
    return <p role="status" className="text-sm text-success">Password changed. Signing you out so you can sign in with the new one…</p>;
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
      <p className="text-sm text-ink-muted">You need your current password. Changing it signs you out on every device, this one too.</p>
      <PasswordInput
        label="Current password"
        autoComplete="current-password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        required
      />
      <PasswordInput
        label="New password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        showStrength
        required
      />
      <div>
        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          aria-invalid={mismatch || undefined}
          required
        />
        {mismatch ? <p aria-live="polite" className="mt-1 text-xs text-error">Passwords do not match</p> : null}
      </div>
      {error ? <p role="alert" className="text-xs text-error">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={busy}>{busy ? "Changing…" : "Change password"}</Button>
        <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => {
          clear();
          closeSheet?.();
        }}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

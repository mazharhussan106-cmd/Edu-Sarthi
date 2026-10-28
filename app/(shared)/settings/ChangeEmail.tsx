// Owns "Change email" under Settings → Security: the new address (and the
// current password, when the account has one), then the code from the new
// address (and from the current one, when it has no password), then a
// sign-out so the next sign-in uses the new address (app/api/profile/email).
//
// The password is kept in this form's memory between the two steps, because
// the server checks it on both; it is cleared when the form closes. The Google
// note is shown to everyone: this form does not know whether the account uses
// Google, and the server unlinks it either way.

"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { emailChangeConfirmSchema, emailChangeStartSchema } from "@/lib/validations";

async function call(body: object): Promise<{ error: string | null; needsOldCode?: boolean }> {
  try {
    const res = await fetch("/api/profile/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const raw = await res.text();
    let data: { error?: string; needsOldCode?: boolean } = {};
    try {
      data = JSON.parse(raw);
    } catch {
      return { error: "Something went wrong. Nothing was changed. Try again in a moment." };
    }
    return res.ok ? { error: null, needsOldCode: data.needsOldCode } : { error: data.error ?? "Something went wrong. Try again." };
  } catch {
    return { error: "Could not reach the server. Nothing was changed. Check your connection and try again." };
  }
}

const codeInput = (v: string) => v.replace(/\D/g, "").slice(0, 6);

export function ChangeEmail({ currentEmail, hasPassword }: { currentEmail: string; hasPassword: boolean }) {
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState<{ to: string; needsOldCode: boolean } | null>(null);
  const [newCode, setNewCode] = useState("");
  const [oldCode, setOldCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function close() {
    setOpen(false);
    setSent(null);
    setError(null);
    setNewEmail("");
    setPassword("");
    setNewCode("");
    setOldCode("");
  }

  async function start(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    const parsed = emailChangeStartSchema.safeParse({ newEmail, currentPassword: hasPassword ? password : undefined });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Check the new email.");
    if (hasPassword && !password) return setError("Enter your current password.");
    setBusy(true);
    const r = await call({ action: "start", ...parsed.data });
    setBusy(false);
    if (r.error) return setError(r.error);
    setSent({ to: parsed.data.newEmail, needsOldCode: Boolean(r.needsOldCode) });
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!sent) return;
    setError(null);
    const parsed = emailChangeConfirmSchema.safeParse({
      newEmail: sent.to,
      newCode,
      currentPassword: hasPassword ? password : undefined,
      oldCode: sent.needsOldCode ? oldCode : undefined,
    });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Enter the 6-digit codes from your email.");
    setBusy(true);
    const r = await call({ action: "confirm", ...parsed.data });
    if (r.error) {
      setBusy(false);
      return setError(r.error);
    }
    setDone(true);
    // Every session ended on the server, this one too.
    await signOut({ callbackUrl: "/login" });
  }

  if (done) return <p role="status" className="text-sm text-success">Email changed. Signing you out so you can sign in with the new address…</p>;

  if (!open) {
    return (
      <div>
        <p className="text-sm text-ink-muted">
          Your email is <b className="text-ink">{currentEmail}</b>. To change it we send a code to the new address
          {hasPassword ? " and ask for your password" : ", and one to this address"}. Changing it signs you out on every device.
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setOpen(true)}>Change email</Button>
      </div>
    );
  }

  const googleNote = (
    <p className="text-xs text-ink-muted">
      If you use Continue with Google, use the Google account for the new address from now on. Reset links already sent to the old address stop working.
    </p>
  );

  if (!sent) {
    return (
      <form onSubmit={(e) => void start(e)} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="new-email">New email</Label>
          <Input id="new-email" type="email" inputMode="email" autoComplete="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
        </div>
        {hasPassword ? (
          <PasswordInput label="Current password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        ) : null}
        {googleNote}
        {error ? <p role="alert" className="text-xs text-error">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={busy}>{busy ? "Sending…" : "Email me a code"}</Button>
          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={close}>Cancel</Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={(e) => void confirm(e)} className="flex flex-col gap-4">
      <p className="text-sm text-ink-muted">
        We sent a 6-digit code to <b className="text-ink">{sent.to}</b>
        {sent.needsOldCode ? <> and another to <b className="text-ink">{currentEmail}</b></> : null}. Codes work for 10 minutes. Not there? Check spam, or send them again.
      </p>
      <div>
        <Label htmlFor="new-email-code">Code sent to {sent.to}</Label>
        <Input id="new-email-code" inputMode="numeric" autoComplete="one-time-code" value={newCode} onChange={(e) => setNewCode(codeInput(e.target.value))} className="max-w-40 font-mono tracking-[0.3em]" required />
      </div>
      {sent.needsOldCode ? (
        <div>
          <Label htmlFor="old-email-code">Code sent to {currentEmail}</Label>
          <Input id="old-email-code" inputMode="numeric" value={oldCode} onChange={(e) => setOldCode(codeInput(e.target.value))} className="max-w-40 font-mono tracking-[0.3em]" required />
        </div>
      ) : null}
      {error ? <p role="alert" className="text-xs text-error">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={busy}>{busy ? "Changing…" : "Change email"}</Button>
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void start()}>Send again</Button>
        <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={close}>Cancel</Button>
      </div>
    </form>
  );
}

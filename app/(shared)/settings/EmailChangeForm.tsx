// Owns "Change email" in Settings: type the new address (and the current
// password, if the account has one), then enter the code sent to it — plus a
// second code sent to the current address when there is no password.
//
// On success it signs this device out too and sends the person to sign in with
// the new address: the session still carries the old one, and every other
// device has already been signed out by the server (owner's decision N8).
// It deliberately keeps the codes only in this component's state.

"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { callApi } from "@/components/decks/deckClient";
import { emailChangeSchema } from "@/lib/accountSchemas";

type Step = "closed" | "start" | "code" | "done";

export function EmailChangeForm({ currentEmail, hasPassword }: { currentEmail: string; hasPassword: boolean }) {
  const [step, setStep] = useState<Step>("closed");
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [currentCode, setCurrentCode] = useState("");
  const [needsCurrent, setNeedsCurrent] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(e?: React.FormEvent) {
    e?.preventDefault();
    const parsed = emailChangeSchema.safeParse({ action: "start", newEmail, password: hasPassword ? password : undefined });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Check the address and try again.");
    if (hasPassword && !password) return setError("Enter your current password.");
    setBusy(true);
    setError(null);
    const res = await callApi<{ sentTo: string; currentCode: boolean }>("/api/profile/email", parsed.data);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setSentTo(res.data.sentTo);
    setNeedsCurrent(res.data.currentCode);
    setCode("");
    setCurrentCode("");
    setStep("code");
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    const parsed = emailChangeSchema.safeParse({ action: "confirm", code, currentCode: needsCurrent ? currentCode : undefined });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Enter the 6-digit code.");
    setBusy(true);
    setError(null);
    const res = await callApi<{ email: string }>("/api/profile/email", parsed.data);
    if (!res.ok) {
      setBusy(false);
      return setError(res.error);
    }
    setStep("done");
    // A moment to read the message, then out: this session still names the old address.
    setTimeout(() => void signOut({ callbackUrl: "/login" }), 2500);
  }

  function close() {
    setStep("closed");
    setPassword("");
    setError(null);
  }

  const errorLine = error ? (
    <p role="alert" className="text-xs text-error">
      {error}
    </p>
  ) : null;

  return (
    <div>
      <p className="text-sm text-ink">
        Sign-in email: <span className="break-all font-medium">{currentEmail}</span>
      </p>

      {step === "closed" ? (
        <>
          <p className="mt-1 text-xs text-ink-muted">
            Changing it signs you out on every device, this one too. If you sign in with Google, the same Google account keeps working.
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setStep("start")}>
            Change email
          </Button>
        </>
      ) : null}

      {step === "start" ? (
        <form onSubmit={start} className="mt-3 flex flex-col gap-3">
          <div>
            <Label htmlFor="new-email">New email</Label>
            <Input id="new-email" type="email" autoComplete="email" inputMode="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          </div>
          {hasPassword ? (
            <PasswordInput id="current-password" label="Your current password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          ) : (
            <p className="text-xs text-ink-muted">We will also send a code to {currentEmail}, to check it is you.</p>
          )}
          {errorLine}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? "Sending…" : "Send code"}
            </Button>
            <Button variant="ghost" size="sm" onClick={close} disabled={busy}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {step === "code" ? (
        <form onSubmit={confirm} className="mt-3 flex flex-col gap-3">
          <p className="text-sm text-ink-muted">
            We sent a 6-digit code to <span className="break-all font-medium text-ink">{sentTo}</span>
            {needsCurrent ? <> and another to <span className="break-all font-medium text-ink">{currentEmail}</span></> : null}. Codes work for 10 minutes.
          </p>
          <div>
            <Label htmlFor="new-email-code">Code sent to the new address</Label>
            <Input id="new-email-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="max-w-40 font-mono tracking-widest" />
          </div>
          {needsCurrent ? (
            <div>
              <Label htmlFor="current-email-code">Code sent to your current address</Label>
              <Input id="current-email-code" inputMode="numeric" maxLength={6} value={currentCode} onChange={(e) => setCurrentCode(e.target.value.replace(/\D/g, ""))} className="max-w-40 font-mono tracking-widest" />
            </div>
          ) : null}
          {errorLine}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? "Changing…" : "Change email"}
            </Button>
            {/* The password is still in state, so a new code needs no retyping; the server enforces the wait. */}
            <Button variant="outline" size="sm" onClick={() => void start()} disabled={busy}>
              Send a new code
            </Button>
            <Button variant="ghost" size="sm" onClick={close} disabled={busy}>
              Cancel
            </Button>
          </div>
          <p className="text-xs text-ink-muted">No code? Check spam. If the new address already has an EduSarthi account, it gets a note instead of a code.</p>
        </form>
      ) : null}

      {step === "done" ? (
        <p role="status" className="mt-3 text-sm text-success">
          Your sign-in email is now {sentTo}. Signing you out — sign in again with the new address.
        </p>
      ) : null}
    </div>
  );
}

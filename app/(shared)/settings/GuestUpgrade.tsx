// Owns "Keep your progress" for a guest: name and email, then the code from
// that email, then the same account is a full one (app/api/profile/
// guest-upgrade).
//
// It wraps itself in a SessionProvider only to call update() at the end. The
// session still says "guest" until it is re-read, and update() makes the
// server re-read the account row (lib/auth.ts). It deliberately does NOT
// trust anything it sends in that update; the server ignores the payload.

"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { guestUpgradeSendSchema, guestUpgradeVerifySchema } from "@/lib/validations";

async function call(body: object): Promise<string | null> {
  try {
    const res = await fetch("/api/profile/guest-upgrade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const raw = await res.text();
    let data: { error?: string } = {};
    try {
      data = JSON.parse(raw);
    } catch {
      return "Something went wrong. Try again in a moment.";
    }
    return res.ok ? null : (data.error ?? "Something went wrong. Try again.");
  } catch {
    return "Could not reach the server. Check your connection and try again.";
  }
}

function Steps() {
  const { update } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    const parsed = guestUpgradeSendSchema.safeParse({ name, email });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Check your name and email.");
    setBusy(true);
    const err = await call({ action: "send", ...parsed.data });
    setBusy(false);
    if (err) return setError(err);
    setSentTo(parsed.data.email);
    setCode("");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = guestUpgradeVerifySchema.safeParse({ name, email: sentTo ?? email, code });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Enter the 6-digit code from your email.");
    setBusy(true);
    const err = await call({ action: "verify", ...parsed.data });
    if (err) {
      setBusy(false);
      return setError(err);
    }
    setDone(true);
    // The account changed under this session; re-read it, then reload so
    // every page and menu stops treating this as a guest. update() with no
    // argument only reads the session; any payload makes it a real update
    // (the server ignores the payload and reads the account row).
    await update({ refresh: true });
    window.location.reload();
  }

  if (done) return <p role="status" className="text-sm text-success">Done. This is now a full account, and your progress is kept. Loading your settings…</p>;

  if (!sentTo) {
    return (
      <form onSubmit={(e) => void send(e)} className="flex flex-col gap-3">
        <p className="text-sm text-ink-muted">
          Add your name and email to make this a full account. Your cards and progress stay. Then you can record, get teacher audits and make decks.
        </p>
        <div>
          <Label htmlFor="upgrade-name">Your name</Label>
          <Input id="upgrade-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} required />
        </div>
        <div>
          <Label htmlFor="upgrade-email">Email</Label>
          <Input id="upgrade-email" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        {error ? <p role="alert" className="text-xs text-error">{error}</p> : null}
        <Button type="submit" size="sm" className="self-start" disabled={busy}>{busy ? "Sending…" : "Email me a code"}</Button>
      </form>
    );
  }

  return (
    <form onSubmit={(e) => void verify(e)} className="flex flex-col gap-3">
      <p className="text-sm text-ink-muted">
        We sent a 6-digit code to <b className="text-ink">{sentTo}</b>. It works for 10 minutes. Not there? Check spam, or ask for a new code.
      </p>
      <div>
        <Label htmlFor="upgrade-code">Code</Label>
        <Input
          id="upgrade-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="max-w-40 font-mono tracking-[0.3em]"
          required
        />
      </div>
      {error ? <p role="alert" className="text-xs text-error">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={busy}>{busy ? "Checking…" : "Confirm"}</Button>
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void send()}>Send a new code</Button>
        <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => { setSentTo(null); setError(null); }}>Use another email</Button>
      </div>
    </form>
  );
}

export function GuestUpgrade() {
  return (
    <SessionProvider>
      <Steps />
    </SessionProvider>
  );
}

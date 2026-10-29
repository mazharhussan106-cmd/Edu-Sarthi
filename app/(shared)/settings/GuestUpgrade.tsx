// Owns "Keep your progress" for a guest: name and email, then the code from
// that email (app/api/profile/guest-upgrade). A new address makes this same
// account a full one; an address that already has a student account gets this
// guest's cards added to it, and the person then signs in there.
//
// It wraps itself in a SessionProvider only to call update() at the end. The
// session still says "guest" until it is re-read, and update() makes the
// server re-read the account row (lib/auth.ts). It deliberately does NOT
// trust anything it sends in that update; the server ignores the payload.

"use client";

import { SessionProvider, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { guestUpgradeSendSchema, guestUpgradeVerifySchema } from "@/lib/validations";

type Mode = "upgrade" | "merge";

async function call(body: object): Promise<{ error: string | null; mode?: Mode }> {
  try {
    const res = await fetch("/api/profile/guest-upgrade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const raw = await res.text();
    let data: { error?: string; mode?: Mode } = {};
    try {
      data = JSON.parse(raw);
    } catch {
      return { error: "Something went wrong. Try again in a moment." };
    }
    return res.ok ? { error: null, mode: data.mode } : { error: data.error ?? "Something went wrong. Try again." };
  } catch {
    return { error: "Could not reach the server. Check your connection and try again." };
  }
}

function Steps() {
  const { update } = useSession();
  // Unique ids for the form fields, so a label always finds its own input.
  const uid = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState<{ to: string; mode: Mode } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Mode | null>(null);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    const parsed = guestUpgradeSendSchema.safeParse({ name, email });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Check your name and email.");
    setBusy(true);
    const r = await call({ action: "send", ...parsed.data });
    setBusy(false);
    if (r.error) return setError(r.error);
    setSent({ to: parsed.data.email, mode: r.mode ?? "upgrade" });
    setCode("");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = guestUpgradeVerifySchema.safeParse({ name, email: sent?.to ?? email, code });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Enter the 6-digit code from your email.");
    setBusy(true);
    const r = await call({ action: "verify", ...parsed.data });
    if (r.error) {
      setBusy(false);
      return setError(r.error);
    }
    if (r.mode === "merge") {
      // The guest account no longer exists; end its session here and let
      // the person sign in to the account that now holds their cards.
      setDone("merge");
      await signOut({ redirect: false });
      return;
    }
    setDone("upgrade");
    // The account changed under this session; re-read it, then reload so
    // every page and menu stops treating this as a guest. update() with no
    // argument only reads the session; any payload makes it a real update
    // (the server ignores the payload and reads the account row).
    await update({ refresh: true });
    window.location.reload();
  }

  if (done === "merge") {
    return (
      <div role="status" className="flex flex-col gap-3">
        <p className="text-sm text-success">Done. Your guest cards are now in the account for {sent?.to}.</p>
        <p className="text-sm text-ink-muted">This guest account is closed. Sign in with that email to carry on where you left off.</p>
        <Link href="/login" className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-dark">Sign in</Link>
      </div>
    );
  }
  if (done) return <p role="status" className="text-sm text-success">Done. This is now a full account, and your progress is kept. Loading your settings…</p>;

  if (!sent) {
    return (
      <form onSubmit={(e) => void send(e)} className="flex flex-col gap-3">
        <p className="text-sm text-ink-muted">
          Add your name and email to make this a full account. Your cards and progress stay. Then you can record, get teacher audits and make decks.
          Already have an account? Use its email, and we add these cards to it.
        </p>
        <div>
          <Label htmlFor={`${uid}-name`}>Your name</Label>
          <Input id={`${uid}-name`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} required />
        </div>
        <div>
          <Label htmlFor={`${uid}-email`}>Email</Label>
          <Input id={`${uid}-email`} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        {error ? <p role="alert" className="text-xs text-error">{error}</p> : null}
        <Button type="submit" size="sm" className="self-start" disabled={busy}>{busy ? "Sending…" : "Email me a code"}</Button>
      </form>
    );
  }

  return (
    <form onSubmit={(e) => void verify(e)} className="flex flex-col gap-3">
      {sent.mode === "merge" ? (
        <p className="text-sm text-ink-muted">
          <b className="text-ink">{sent.to}</b> already has an EduSarthi account, so we sent it a 6-digit code. Type it to add the cards you
          studied as a guest to that account. Where both studied the same card, the one with more practice is kept. Then you sign in
          there, and this guest account closes.
        </p>
      ) : (
        <p className="text-sm text-ink-muted">
          We sent a 6-digit code to <b className="text-ink">{sent.to}</b>. It works for 10 minutes. Not there? Check spam, or ask for a new code.
        </p>
      )}
      <div>
        <Label htmlFor={`${uid}-code`}>Code</Label>
        <Input
          id={`${uid}-code`}
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
        <Button type="submit" size="sm" disabled={busy}>{busy ? "Checking…" : sent.mode === "merge" ? "Add my progress" : "Confirm"}</Button>
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void send()}>Send a new code</Button>
        <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => { setSent(null); setError(null); }}>Use another email</Button>
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

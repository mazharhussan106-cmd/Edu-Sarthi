// Owns the "sign out of all devices" control on the settings page.
//
// It signs out THIS device too, right after the server call: the point of the
// button is "someone else may have my account", so leaving this tab signed in
// would leave the student confused about whether it worked.

"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";

export function SignOutEverywhere() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/sign-out-everywhere", { method: "POST" });
      if (!res.ok) {
        setError("Could not sign you out of other devices. Check your connection and try again.");
        setBusy(false);
        return;
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setBusy(false);
      return;
    }
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <div>
      <p className="text-sm text-ink-muted">
        Lost a phone or used a shared computer? This signs you out everywhere, including here. You
        will need to sign in again.
      </p>
      <Button variant="outline" size="sm" className="mt-4" onClick={() => void run()} disabled={busy}>
        {busy ? "Signing out…" : "Sign out of all devices"}
      </Button>
      {error ? <p role="alert" className="mt-2 text-xs text-error">{error}</p> : null}
    </div>
  );
}

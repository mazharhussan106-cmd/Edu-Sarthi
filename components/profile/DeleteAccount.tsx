// Owns the delete-my-account form inside its sheet. It asks for DELETE typed
// out rather than a confirm() dialog: on a phone a dialog's OK button sits
// exactly where the thumb already is.
//
// Students only. Teacher and admin accounts are closed by support, because
// the audits they wrote must outlive them (app/api/me says so too).

"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useOnSheetClosed, useSheetClose } from "@/components/ui/Sheet";
import { deleteAccountSchema } from "@/lib/validations";

export function DeleteAccount() {
  const close = useSheetClose();
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useOnSheetClosed(() => {
    setConfirm("");
    setError(null);
  });

  async function erase() {
    setError(null);
    const parsed = deleteAccountSchema.safeParse({ confirm });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Type DELETE to confirm.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/me", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      if (!res.ok) {
        const raw = await res.text();
        let data: { error?: string } = {};
        try {
          data = JSON.parse(raw);
        } catch {
          data = {};
        }
        setError(data.error ?? "Your account was not deleted. Try again in a minute.");
        setBusy(false);
        return;
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setBusy(false);
      return;
    }
    await signOut({ callbackUrl: "/" });
  }

  return (
    <div>
      <p className="text-sm text-ink-muted">
        Removes your account, every recording and every audit. This cannot be undone. Download your data first if you want a copy.
      </p>
      <Label htmlFor="delete-confirm" className="mt-4">
        Type DELETE to confirm
      </Label>
      <Input id="delete-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" placeholder="DELETE" />
      {error ? (
        <p role="alert" className="mt-2 text-xs text-error">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex gap-2 [&>*]:flex-1">
        <Button variant="outline" onClick={() => close?.()}>
          Cancel
        </Button>
        <Button variant="outline" onClick={() => void erase()} disabled={busy || confirm !== "DELETE"} className="text-error">
          {busy ? "Deleting…" : "Delete for good"}
        </Button>
      </div>
    </div>
  );
}

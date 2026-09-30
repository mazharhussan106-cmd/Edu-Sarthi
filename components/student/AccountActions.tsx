// Owns the student's account controls on the profile page: set a display
// name, download my data, and delete my account.
//
// Deletion asks for DELETE typed out rather than a confirm() dialog. On a
// phone a dialog's OK button sits exactly where the thumb already is.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { deleteAccountSchema, nameSchema } from "@/lib/validations";

async function send(url: string, method: string, body: object) {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const raw = await res.text();
    let data: { error?: string } = {};
    try {
      data = JSON.parse(raw);
    } catch {
      data = { error: "Something went wrong. Try again." };
    }
    return res.ok ? null : (data.error ?? "Something went wrong. Try again.");
  } catch {
    return "Could not reach the server. Check your connection and try again.";
  }
}

export function NameForm({ initialName }: { initialName: string | null }) {
  const router = useRouter();
  const [name, setName] = useState(initialName ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = nameSchema.safeParse({ name });
    if (!parsed.success) {
      setMsg({ ok: false, text: parsed.error.issues[0]?.message ?? "Enter your name." });
      return;
    }
    setBusy(true);
    const error = await send("/api/profile/name", "PATCH", parsed.data);
    setBusy(false);
    setMsg(error ? { ok: false, text: error } : { ok: true, text: "Saved." });
    if (!error) router.refresh();
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-2">
      <Label htmlFor="display-name">Your name</Label>
      <div className="flex gap-2">
        <Input
          id="display-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder="e.g. Rahul Sharma"
        />
        <Button type="submit" disabled={busy} className="shrink-0">
          {busy ? "Saving…" : "Save"}
        </Button>
      </div>
      {msg ? (
        <p aria-live="polite" className={msg.ok ? "text-xs text-success" : "text-xs text-error"}>
          {msg.text}
        </p>
      ) : null}
    </form>
  );
}

export function DataRights() {
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function erase() {
    setError(null);
    const parsed = deleteAccountSchema.safeParse({ confirm });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Type DELETE to confirm.");
      return;
    }
    setBusy(true);
    const err = await send("/api/me", "DELETE", parsed.data);
    if (err) {
      setError(err);
      setBusy(false);
      return;
    }
    await signOut({ callbackUrl: "/" });
  }

  return (
    <Card className="mt-4">
      <CardTitle>Your data</CardTitle>
      <p className="mt-2 text-sm text-ink-muted">
        Download everything stored about your account, or delete it for good.
      </p>
      {/* A plain link: the route answers with a file download, and a link is
          what works when JavaScript is slow to load on a weak connection. */}
      <a
        href="/api/me"
        className="mt-4 inline-flex h-9 items-center rounded-lg border border-border-strong px-3 text-sm text-ink hover:bg-hover"
      >
        Download my data
      </a>

      <div className="mt-6 border-t border-border pt-4">
        <Label htmlFor="delete-confirm">Delete account</Label>
        <p className="mb-2 text-xs text-ink-muted">
          Removes your account, every recording and every audit. This cannot be
          undone. Type DELETE to confirm.
        </p>
        <div className="flex gap-2">
          <Input
            id="delete-confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="off"
            placeholder="DELETE"
          />
          <Button
            variant="outline"
            onClick={() => void erase()}
            disabled={busy || confirm !== "DELETE"}
            className="shrink-0 text-error"
          >
            {busy ? "Deleting…" : "Delete"}
          </Button>
        </div>
        {error ? (
          <p role="alert" className="mt-2 text-xs text-error">
            {error}
          </p>
        ) : null}
      </div>
    </Card>
  );
}

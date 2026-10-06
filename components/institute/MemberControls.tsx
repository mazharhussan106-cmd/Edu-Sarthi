// Owns the institute admin's controls: a member's role and removal, and the
// join code with its "new code" button.
//
// It deliberately does NOT decide who may use them — the API checks the caller
// is the institute's admin; these only offer the buttons to someone who is.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { callApi } from "@/components/decks/deckClient";

async function act(router: ReturnType<typeof useRouter>, body: object, setError: (e: string | null) => void, setBusy: (b: boolean) => void) {
  setBusy(true);
  setError(null);
  const res = await callApi("/api/institute", body);
  setBusy(false);
  if (!res.ok) return setError(res.error);
  router.refresh();
}

export function MemberControls({ userId, role }: { userId: string; role: "TEACHER" | "STUDENT" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = role === "TEACHER" ? "STUDENT" : "TEACHER";
  return (
    <span className="flex flex-col items-end gap-1">
      <span className="flex gap-1">
        <Button size="sm" variant="outline" disabled={busy} onClick={() => act(router, { action: "setRole", userId, role: next }, setError, setBusy)}>
          Make {next.toLowerCase()}
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} className="text-error" onClick={() => { if (window.confirm("Remove this person from the institute?")) void act(router, { action: "removeMember", userId }, setError, setBusy); }}>
          Remove
        </Button>
      </span>
      {error ? <span role="alert" className="max-w-56 text-right text-xs text-error">{error}</span> : null}
    </span>
  );
}

export function JoinCodeBox({ code }: { code: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="text-sm font-medium text-ink">Join code</p>
      <p className="mt-0.5 text-xs text-ink-muted">Give this to your students. A new code stops the old one working; people already in stay in.</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <code className="rounded-lg bg-paper-dim px-3 py-2 font-mono text-lg tracking-widest text-ink">{code}</code>
        <Button variant="outline" size="sm" onClick={async () => { try { await navigator.clipboard.writeText(code); setCopied(true); } catch { setError("Could not copy. Select the code and copy it by hand."); } }}>
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button variant="ghost" size="sm" disabled={busy} onClick={() => { if (window.confirm("Make a new join code? The old one stops working.")) void act(router, { action: "newCode" }, setError, setBusy); }}>
          New code
        </Button>
      </div>
      {error ? <p role="alert" className="mt-1 text-sm text-error">{error}</p> : null}
    </div>
  );
}

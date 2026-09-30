// Owns the teacher's claim buttons and the claim countdown: Claim (from the
// queue), Release (give it back), Extend (restart the 30 minutes), and the
// ticking timer that shows how long a claim has left.
//
// They share one file because they share one request helper and one idea —
// the teacher's hold on a submission — and are never useful apart.

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

async function post(body: object): Promise<{ ok: boolean; error?: string; claimedAt?: string }> {
  try {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const raw = await res.text();
    let data: { error?: string; claimedAt?: string } = {};
    try {
      data = JSON.parse(raw);
    } catch {
      data = { error: "Something went wrong. Try again." };
    }
    return { ok: res.ok, ...data };
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection and try again." };
  }
}

export function ClaimButton({
  submissionId,
  label = "Claim",
}: {
  submissionId: string;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function claim() {
    setBusy(true);
    setError(null);
    const r = await post({ action: "claim", submissionId });
    if (!r.ok) {
      setError(r.error ?? "Could not claim it. Refresh the queue.");
      setBusy(false);
      router.refresh();
      return;
    }
    router.push(`/review/${submissionId}`);
    // From the review page itself the URL does not change, so the server
    // component must be asked to re-render with the new claim.
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={() => void claim()} disabled={busy}>
        {busy ? "Claiming…" : label}
      </Button>
      {error ? (
        <p role="alert" className="max-w-48 text-right text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ReleaseButton({
  submissionId,
  redirectTo,
  size = "sm",
}: {
  submissionId: string;
  redirectTo?: string;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function release() {
    setBusy(true);
    const r = await post({ action: "release", submissionId });
    if (!r.ok) {
      setError(r.error ?? "Could not release it.");
      setBusy(false);
      return;
    }
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button variant="outline" size={size} onClick={() => void release()} disabled={busy}>
        {busy ? "Releasing…" : "Release"}
      </Button>
      {error ? (
        <span role="alert" className="text-xs text-error">
          {error}
        </span>
      ) : null}
    </span>
  );
}

function remaining(expiresAt: number): number {
  return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
}

/// Counts down to the claim's expiry. With `submissionId`, it also offers
/// Extend in the last five minutes — the moment a teacher mid-audit needs it.
export function ClaimTimer({
  expiresAt,
  submissionId,
  minutes,
}: {
  expiresAt: string;
  submissionId?: string;
  minutes: number;
}) {
  const router = useRouter();
  const [end, setEnd] = useState(() => new Date(expiresAt).getTime());
  const [left, setLeft] = useState(() => remaining(new Date(expiresAt).getTime()));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setLeft(remaining(end)), 1000);
    return () => clearInterval(t);
  }, [end]);

  async function extend() {
    if (!submissionId) return;
    setBusy(true);
    const r = await post({ action: "extend", submissionId });
    setBusy(false);
    if (r.ok && r.claimedAt) {
      const next = new Date(r.claimedAt).getTime() + minutes * 60_000;
      setEnd(next);
      setLeft(remaining(next));
    } else {
      router.refresh();
    }
  }

  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");
  const low = left < 5 * 60;

  return (
    <span className="inline-flex items-center gap-2">
      <span
        role="timer"
        aria-label={`Claim ends in ${mm} minutes ${ss} seconds`}
        className={cn(
          "rounded-full px-2.5 py-0.5 font-mono text-xs font-medium",
          left === 0 ? "bg-error/12 text-error" : low ? "bg-error/12 text-error" : "bg-accent/12 text-accent",
        )}
      >
        {left === 0 ? "Claim expired" : `${mm}:${ss} left`}
      </span>
      {submissionId && low ? (
        <Button variant="outline" size="sm" onClick={() => void extend()} disabled={busy}>
          {busy ? "Extending…" : `Extend ${minutes} min`}
        </Button>
      ) : null}
    </span>
  );
}

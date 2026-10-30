// Owns the inbox page's two read actions that are not a tap on one item:
// "Mark all as read", and recording that the notices at the top were seen.
//
// Notices are marked from the browser after they are on screen, never while
// the page renders on the server: Next can render a page ahead of a visit, and
// an inbox that marked itself read before anyone looked would lie.
// It deliberately holds no list state; the page re-renders from the server.

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { sendInboxAction } from "@/components/notifications/inboxClient";

export function MarkAllRead() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    const res = await sendInboxAction({ action: "read-all" });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <Button variant="outline" size="sm" onClick={run} disabled={busy}>
        {busy ? "Marking…" : "Mark all as read"}
      </Button>
      {error ? (
        <p role="alert" className="max-w-56 text-right text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/// Renders nothing. The ids are joined into one string so a re-render with the
/// same notices does not send the mark again.
export function NoticesSeen({ ids }: { ids: readonly string[] }) {
  const key = ids.join(",");
  useEffect(() => {
    if (!key) return;
    // A failure is left alone: the notices simply stay unread until next time.
    void sendInboxAction({ action: "notices-seen", ids: key.split(",") });
  }, [key]);
  return null;
}

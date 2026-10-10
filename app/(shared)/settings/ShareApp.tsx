// Owns the "Share EduSarthi" control in Settings: the phone's own share sheet
// where there is one, WhatsApp, and copy-link as the fallback.
//
// It shares only the site's address and one honest sentence. There is no
// referral code and nothing is tracked, so it makes no promise of a reward and
// does not record who shared with whom.

"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";

const MESSAGE = "EduSarthi: practise spoken English, get a teacher's scored audit, and learn with flashcards.";

function siteUrl(): string {
  // The configured address wins so a link shared from a preview build still
  // points at the real site; the page's own origin is the fallback.
  return (process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin).replace(/\/+$/, "");
}

export function ShareApp() {
  const [note, setNote] = useState<string | null>(null);
  // Filled in after mount: the address comes from the browser, and building it
  // during render would make the server and client HTML disagree.
  const [whatsapp, setWhatsapp] = useState("https://wa.me/");
  useEffect(() => {
    setWhatsapp(`https://wa.me/?text=${encodeURIComponent(`${MESSAGE} ${siteUrl()}`)}`);
  }, []);

  async function share() {
    setNote(null);
    const url = siteUrl();
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "EduSarthi", text: MESSAGE, url });
      } catch {
        // Closing the share sheet rejects too; that is a choice, not an error.
      }
      return;
    }
    await copy(url);
  }

  async function copy(url = siteUrl()) {
    try {
      await navigator.clipboard.writeText(url);
      setNote("Link copied. Paste it in any chat.");
    } catch {
      setNote(`Could not copy automatically. The link is ${url}`);
    }
  }

  return (
    <div>
      <p className="text-sm text-ink-muted">Know someone who wants to practise English? Send them the link.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void share()}>Share EduSarthi</Button>
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center rounded-lg border border-border-strong px-3 text-sm font-medium text-ink hover:bg-hover"
        >
          WhatsApp
        </a>
        <Button size="sm" variant="outline" onClick={() => void copy()}>Copy link</Button>
      </div>
      {note ? <p aria-live="polite" className="mt-2 text-xs text-ink-muted">{note}</p> : null}
    </div>
  );
}

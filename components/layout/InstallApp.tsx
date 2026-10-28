// Owns the "Install the app" row at the top of the menu.
//
// Shown every time the menu opens (owner's choice, 28 Oct), unless the app is
// already installed (opened as the app, or installed during this visit).
// Chrome and Android make an install offer once per page load; the root layout
// keeps it (lib/installPrompt), and a tap replays it. Where there is no offer —
// iPhones never make one; some browsers do not, or not yet — the tap shows the
// steps to install from the browser's own menu instead, so the row is never a
// button that does nothing.
//
// It renders only inside the open menu sheet, which exists only in the browser,
// so its first render can read `window` directly: an installed app never sees
// the row flash up for one frame.

"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";

import { INSTALL_CHANGED, installedNow, keptInstall, showInstall, type InstallEvent } from "@/lib/installPrompt";

const IOS = /iphone|ipad|ipod/i;

const STEPS_IOS = "In Safari, tap the Share button, then “Add to Home Screen”.";
const STEPS_OTHER = "Open your browser's menu (⋮) and tap “Install app” or “Add to Home screen”. If neither is there, open EduSarthi in Chrome and try again.";
const FAILED = "The install box did not open. " + STEPS_OTHER;

export function InstallApp() {
  const [offer, setOffer] = useState<InstallEvent | null>(() => keptInstall());
  const [installed, setInstalled] = useState(() => installedNow());
  const [ios] = useState(() => IOS.test(navigator.userAgent));
  const [steps, setSteps] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const read = () => {
      setOffer(keptInstall());
      setInstalled(installedNow());
    };
    window.addEventListener(INSTALL_CHANGED, read);
    return () => window.removeEventListener(INSTALL_CHANGED, read);
  }, []);

  if (installed) return null;

  function onTap() {
    if (offer) {
      // An offer is used up either way; if it fails, say what to do instead.
      void showInstall().catch(() => setFailed(true));
    } else {
      setSteps((s) => !s);
    }
  }

  return (
    <div className="py-1">
      <button
        type="button"
        onClick={onTap}
        aria-expanded={offer ? undefined : steps}
        className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left font-body text-sm font-medium text-accent hover:bg-hover"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Install the app
      </button>
      {steps ? <p className="px-3 pb-2 text-xs text-ink-muted">{ios ? STEPS_IOS : STEPS_OTHER}</p> : null}
      {failed ? (
        <p role="status" className="px-3 pb-2 text-xs text-ink-muted">
          {FAILED}
        </p>
      ) : null}
    </div>
  );
}

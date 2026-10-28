// Owns the "Install app" row in the menu.
//
// Chrome and Android make the install offer once per page load; the root
// layout keeps it (lib/installPrompt) so this row can replay it on tap, however
// long after the page loaded the menu is opened. iPhones never make the offer,
// so there it shows the Share → Add to Home Screen steps instead. Already
// installed (standalone, or installed during this visit), it renders nothing.
//
// It deliberately renders nothing on a browser that offers neither, rather
// than a button that does nothing.

"use client";

import { useEffect, useState } from "react";

import { INSTALL_CHANGED, installedNow, keptInstall, showInstall, type InstallEvent } from "@/lib/installPrompt";

const FAILED = "The install box did not open. Use your browser's ⋮ menu, then “Install app” or “Add to Home screen”.";

export function InstallApp() {
  const [offer, setOffer] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [hint, setHint] = useState(false);
  // Kept after a failed offer, which is used up either way, so the row stays
  // to say what to do instead of silently disappearing.
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const read = () => {
      setOffer(keptInstall());
      setInstalled(installedNow());
    };
    read();
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    window.addEventListener(INSTALL_CHANGED, read);
    return () => window.removeEventListener(INSTALL_CHANGED, read);
  }, []);

  if (installed || (!offer && !ios && !failed)) return null;

  return (
    <div className="mt-2 border-t border-border pt-2">
      {offer || ios ? (
        <button
          type="button"
          onClick={() => (offer ? void showInstall().catch(() => setFailed(true)) : setHint((h) => !h))}
          className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm text-ink-muted hover:bg-hover hover:text-ink"
        >
          Install app on this phone
        </button>
      ) : null}
      {hint ? (
        <p className="px-3 pb-2 text-xs text-ink-muted">
          Tap the Share button in Safari, then “Add to Home Screen”.
        </p>
      ) : null}
      {failed ? (
        <p role="status" className="px-3 pb-2 text-xs text-ink-muted">
          {FAILED}
        </p>
      ) : null}
    </div>
  );
}

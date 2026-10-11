// Owns the "Install app" row in the menu.
//
// Chrome and Android fire `beforeinstallprompt`, which this keeps and replays
// on tap. iPhones never fire it, so there it shows the Share → Add to Home
// Screen steps instead. Already installed (standalone), it renders nothing.
//
// It deliberately renders nothing on a browser that offers neither, rather
// than a button that does nothing.

"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void> };

export function InstallApp() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (installed || (!event && !ios)) return null;

  return (
    <div className="mt-2 border-t border-border pt-2">
      <button
        type="button"
        onClick={() => (event ? void event.prompt() : setHint((h) => !h))}
        className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm text-ink-muted hover:bg-hover hover:text-ink"
      >
        Install app on this phone
      </button>
      {hint ? (
        <p className="px-3 pb-2 text-xs text-ink-muted">
          Tap the Share button in Safari, then “Add to Home Screen”.
        </p>
      ) : null}
    </div>
  );
}

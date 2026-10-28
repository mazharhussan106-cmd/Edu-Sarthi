// Owns keeping the browser's "install this app" offer until someone asks for it.
//
// Chrome and Android fire `beforeinstallprompt` once per page load, as soon as
// the site counts as installable — long before anyone opens the menu. The menu
// mounts its Install row only while the sheet is open, so a listener there
// heard the event only if the menu happened to be open at that moment, which is
// almost never. CAPTURE_INSTALL_JS runs from the root layout before the app
// starts, keeps the event on `window`, and announces it; the Install row reads
// it whenever it mounts.
//
// It deliberately calls preventDefault, as the Install row always did: that
// stops Chrome's own small install bar from popping up by itself, so the offer
// is made from the menu, when the person chooses. Chrome's ⋮ menu still offers
// "Install app" / "Add to Home screen" as usual.
//
// No "use client": the layout (server) imports the script text, the Install row
// (client) the readers. Nothing here runs on import.

export type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __esInstall?: InstallEvent | null;
    __esInstalled?: boolean;
  }
}

/// Fired on window whenever the kept offer changes (arrived, used, installed).
export const INSTALL_CHANGED = "es-install-changed";

/// Plain ES5 so it runs on any browser before the app's own code loads.
export const CAPTURE_INSTALL_JS = `(function(){var w=window;function changed(){w.dispatchEvent(new Event("${INSTALL_CHANGED}"))}
w.addEventListener("beforeinstallprompt",function(e){e.preventDefault();w.__esInstall=e;changed()});
w.addEventListener("appinstalled",function(){w.__esInstall=null;w.__esInstalled=true;changed()})})();`;

export function keptInstall(): InstallEvent | null {
  return window.__esInstall ?? null;
}

export function installedNow(): boolean {
  return Boolean(window.__esInstalled) || window.matchMedia("(display-mode: standalone)").matches;
}

/// Shows the browser's install dialog. An offer works only once, so it is
/// dropped afterwards; if the person says no, the browser makes a new one on a
/// later page load.
export async function showInstall(): Promise<void> {
  const e = keptInstall();
  if (!e) return;
  // Called first, while the tap still counts as the person's own gesture.
  const shown = e.prompt();
  window.__esInstall = null;
  window.dispatchEvent(new Event(INSTALL_CHANGED));
  await shown;
}

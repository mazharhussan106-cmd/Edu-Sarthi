// Owns bringing this device's display settings (text size, Hindi, data saver)
// in line with the signed-in account's saved ones.
//
// Those three live in cookies so the server can paint them on the first frame,
// but a cookie belongs to a device, not an account. On a new phone, or a shared
// computer last used by someone else, the cookie disagrees with the account;
// this fixes it once and the next page load is correct.
//
// It deliberately does nothing when they already agree, so a normal page view
// costs no request.

"use client";

import { useEffect } from "react";

export type SyncPrefs = { textSize: "small" | "normal" | "large"; hideHindi: boolean; dataSaver: boolean };

export function PrefSync({ prefs }: { prefs: SyncPrefs }) {
  useEffect(() => {
    const el = document.documentElement;
    const now = {
      textSize: el.dataset.text === "small" || el.dataset.text === "large" ? el.dataset.text : "normal",
      hideHindi: el.dataset.hindi === "off",
      dataSaver: el.dataset.saver === "on",
    };
    const changed: Partial<SyncPrefs> = {};
    if (now.textSize !== prefs.textSize) changed.textSize = prefs.textSize;
    if (now.hideHindi !== prefs.hideHindi) changed.hideHindi = prefs.hideHindi;
    if (now.dataSaver !== prefs.dataSaver) changed.dataSaver = prefs.dataSaver;
    if (Object.keys(changed).length === 0) return;

    // Applied now so this page is right too; the request sets the cookies
    // for the next load. A failed request just means we try again next page.
    if (prefs.textSize === "normal") el.removeAttribute("data-text");
    else el.setAttribute("data-text", prefs.textSize);
    if (prefs.hideHindi) el.setAttribute("data-hindi", "off");
    else el.removeAttribute("data-hindi");
    if (prefs.dataSaver) el.setAttribute("data-saver", "on");
    else el.removeAttribute("data-saver");

    void fetch("/api/profile/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changed),
    }).catch(() => {});
  }, [prefs.textSize, prefs.hideHindi, prefs.dataSaver]);

  return null;
}

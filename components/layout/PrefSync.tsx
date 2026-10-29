// Owns bringing this device's display settings (theme, text size, Hindi, data
// saver, reduce motion) in line with the signed-in account's saved ones, and
// stamping the voice and Hindi-question settings on <html>, where they are read.
//
// Those five live in cookies so the server can paint them on the first frame,
// but a cookie belongs to a device, not an account. On a new phone, or a shared
// computer last used by someone else, the cookie disagrees with the account;
// this fixes it once and the next page load is correct.
//
// It deliberately does nothing when they already agree, so a normal page view
// costs no request.

"use client";

import { useEffect } from "react";
import type { Theme } from "@prisma/client";

export type SyncPrefs = { textSize: "small" | "normal" | "large"; hideHindi: boolean; dataSaver: boolean; reduceMotion: boolean };

/// Settings that nothing paints from, so they need no cookie: read when a card
/// speaks (lib/speech), or shown only on a card's practice side, which opens
/// after a tap (the Hindi to English questions).
export type LivePrefs = { voiceAccent: string; voiceSpeed: string; hideHindiTask: boolean };

export function PrefSync({ prefs, live, theme }: { prefs: SyncPrefs; live: LivePrefs; theme: { value: Theme; attr: string } | null }) {
  // The theme has its own cookie and its own route (it is a column on the
  // account, not a preference), so it is checked on its own. Without this a
  // new phone showed the light theme while Settings said "Dark".
  const themeValue = theme?.value;
  const themeAttr = theme?.attr;
  useEffect(() => {
    if (!themeValue || !themeAttr) return;
    const el = document.documentElement;
    if ((el.getAttribute("data-theme") ?? "light") === themeAttr) return;
    if (themeAttr === "light") el.removeAttribute("data-theme");
    else el.setAttribute("data-theme", themeAttr);
    void fetch("/api/profile/theme", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: themeValue }),
    }).catch(() => {});
  }, [themeValue, themeAttr]);

  useEffect(() => {
    const el = document.documentElement;
    const set = (name: string, value: string | null) => (value ? el.setAttribute(name, value) : el.removeAttribute(name));
    set("data-voice", live.voiceAccent === "auto" ? null : live.voiceAccent);
    set("data-voice-speed", live.voiceSpeed === "slow" ? "slow" : null);
    set("data-hindi-task", live.hideHindiTask ? "off" : null);
  }, [live.voiceAccent, live.voiceSpeed, live.hideHindiTask]);

  useEffect(() => {
    const el = document.documentElement;
    const now = {
      textSize: el.dataset.text === "small" || el.dataset.text === "large" ? el.dataset.text : "normal",
      hideHindi: el.dataset.hindi === "off",
      dataSaver: el.dataset.saver === "on",
      reduceMotion: el.dataset.motion === "reduce",
    };
    const changed: Partial<SyncPrefs> = {};
    if (now.textSize !== prefs.textSize) changed.textSize = prefs.textSize;
    if (now.hideHindi !== prefs.hideHindi) changed.hideHindi = prefs.hideHindi;
    if (now.dataSaver !== prefs.dataSaver) changed.dataSaver = prefs.dataSaver;
    if (now.reduceMotion !== prefs.reduceMotion) changed.reduceMotion = prefs.reduceMotion;
    if (Object.keys(changed).length === 0) return;

    // Applied now so this page is right too; the request sets the cookies
    // for the next load. A failed request just means we try again next page.
    if (prefs.textSize === "normal") el.removeAttribute("data-text");
    else el.setAttribute("data-text", prefs.textSize);
    if (prefs.hideHindi) el.setAttribute("data-hindi", "off");
    else el.removeAttribute("data-hindi");
    if (prefs.dataSaver) el.setAttribute("data-saver", "on");
    else el.removeAttribute("data-saver");
    if (prefs.reduceMotion) el.setAttribute("data-motion", "reduce");
    else el.removeAttribute("data-motion");

    void fetch("/api/profile/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changed),
    }).catch(() => {});
  }, [prefs.textSize, prefs.hideHindi, prefs.dataSaver, prefs.reduceMotion]);

  return null;
}

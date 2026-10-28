// Owns saving one preference from Settings: the PATCH, and the one line of
// text shown when it may not have saved.
//
// It tells rather than reverts. Snapping a control back under someone's finger
// is more confusing than a line of text. It deliberately does NOT hold the
// setting's value; each control keeps its own state and calls save().

"use client";

import { useState } from "react";

import type { Preferences } from "@/lib/preferences";

export function useSavePreference() {
  const [notice, setNotice] = useState<string | null>(null);

  async function save<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setNotice(null);
    try {
      const res = await fetch("/api/profile/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) setNotice("That change may not have saved. Reload to check.");
    } catch {
      setNotice("That change may not have saved. Check your connection, then reload to check.");
    }
  }

  return { save, notice };
}

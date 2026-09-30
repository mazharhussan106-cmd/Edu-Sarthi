// Owns the flashcard deck's talking to the outside world: saving marks,
// remarks and notes (/api/flashcards), saving the card colour
// (/api/profile/preferences), and the ‹ history kept in sessionStorage.
//
// Every call returns a message the student can act on instead of throwing,
// and every response is read as text first: a proxy error page is not JSON.
// It deliberately holds no React state; FlashcardDeck decides what to show.

import type { CardColor } from "@/lib/cardColors";

const HISTORY_KEY = "flashcard-history";
const HISTORY_MAX = 50;

export function readHistory(): string[] {
  try {
    const v: unknown = JSON.parse(sessionStorage.getItem(HISTORY_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((c): c is string => typeof c === "string") : [];
  } catch {
    return [];
  }
}

export function writeHistory(list: string[]) {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(-HISTORY_MAX)));
  } catch {
    // Private mode or blocked storage: ‹ simply has nothing to go back to.
  }
}

export async function post(body: object) {
  try {
    const res = await fetch("/api/flashcards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const raw = await res.text();
    let data: { error?: string; dueAt?: string } = {};
    try {
      data = JSON.parse(raw);
    } catch {
      data = { error: "Something went wrong. Try again." };
    }
    return res.ok ? { ok: true as const, dueAt: data.dueAt } : { ok: false as const, error: data.error ?? "Could not save. Try again." };
  } catch {
    return { ok: false as const, error: "No connection. Your answer was not saved — try again when you are back online." };
  }
}

/// Returns null on success, or what to tell the student.
export async function saveCardColor(color: CardColor): Promise<string | null> {
  try {
    const res = await fetch("/api/profile/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardColor: color }),
    });
    // A failed save only means the colour is not remembered next visit, so
    // the card keeps the new colour either way.
    return res.ok ? null : "Colour applied, but it may not be remembered next time. Try again later.";
  } catch {
    return "Colour applied, but it was not saved — you are offline.";
  }
}

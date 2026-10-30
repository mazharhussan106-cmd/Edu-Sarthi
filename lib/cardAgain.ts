// Owns the "once more, later this session" list: after Unknown, the card is
// shown again a few cards later as practice (docs/SRS-V2-PLAN.md D5). That
// second look is not saved; the card's review date stays as Unknown set it.
//
// Carried in the URL as ?again=VRB-001~2.VRB-007~0 — each code with how many
// more cards to wait — the same way skips are (lib/cardSkip): it survives a
// refresh and is gone when the student leaves the session.
//
// It deliberately has no database or server imports: the pages and the card
// share it, and the pages pass in how to find a card and the next one.

export type Again = { code: string; wait: number }[];

/// Cards between the Unknown and the practice look.
export const AGAIN_AFTER = 3;
const MAX_AGAIN = 10;
const ENTRY = /^([A-Za-z0-9][A-Za-z0-9_-]{1,39})~(\d)$/;

/// Same code shape as lib/cardSkip; anything else is dropped, and the list is
/// capped so a hand-edited URL cannot grow without limit.
export function parseAgain(raw: string | undefined): Again {
  if (!raw) return [];
  const out: Again = [];
  for (const part of raw.split(".")) {
    const m = ENTRY.exec(part);
    if (m && !out.some((e) => e.code === m[1])) out.push({ code: m[1], wait: Math.min(AGAIN_AFTER, Number(m[2])) });
  }
  return out.slice(-MAX_AGAIN);
}

export function againQuery(again: Again): string {
  return again.length ? `&again=${again.map((e) => `${e.code}~${e.wait}`).join(".")}` : "";
}

/// The list after leaving `code`: it is dropped (it has had its look, or is
/// being answered), every other card has one fewer to wait, and an Unknown
/// puts it back on the end to come round again.
export function afterCard(again: Again, code: string, unknown: boolean): Again {
  const rest = again.filter((e) => e.code !== code).map((e) => ({ code: e.code, wait: Math.max(0, e.wait - 1) }));
  return (unknown ? [...rest, { code, wait: AGAIN_AFTER }] : rest).slice(-MAX_AGAIN);
}

/// Which card a session page shows: a practice card whose wait is over, else
/// the normal next card, else (nothing left today) a practice card that is
/// still waiting, so it is not lost. `find` turns a code into this session's
/// card id, or null for a card that is gone or not in this deck.
export async function pickWithAgain(
  again: Again,
  next: () => Promise<string | null>,
  find: (code: string) => Promise<string | null>,
): Promise<{ id: string | null; practice: boolean; again: Again }> {
  let list = again;
  const ready = list.find((e) => e.wait === 0);
  if (ready) {
    const id = await find(ready.code);
    if (id) return { id, practice: true, again: list };
    list = list.filter((e) => e.code !== ready.code);
  }
  const id = await next();
  if (id) return { id, practice: false, again: list };
  for (const e of list) {
    const pid = await find(e.code);
    if (pid) return { id: pid, practice: true, again: list };
  }
  return { id: null, practice: false, again: [] };
}

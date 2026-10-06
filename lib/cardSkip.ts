// Owns the "skipped this session" list behind the › button: cards passed
// over without an answer, carried in the URL as ?skip=VRB-001.VRB-002.
//
// It deliberately has no database or server imports, so the deck (a client
// component) and the page (a server component) share one parser and one cap.

export const MAX_SKIP = 40;

/// Card codes as they appear in the URL: "VRB-001" for built-in cards,
/// "U-3FA9C21B7E04" for hand-made ones, and whatever ID an imported sheet used
/// ("PY-01-001", "SQL-012"). Anything outside that safe shape is dropped rather
/// than passed to the query, and the list is capped so a hand-edited URL cannot
/// grow the query without limit. (An earlier pattern accepted only "AB-123", so
/// › silently did nothing on every deck card.)
export function parseSkip(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(".").filter((c) => /^[A-Za-z0-9][A-Za-z0-9_-]{1,39}$/.test(c)).slice(-MAX_SKIP);
}

/// The same list with one more card on the end, oldest dropped past the cap.
export function withSkipped(skip: string[], code: string): string[] {
  return [...skip.filter((c) => c !== code), code].slice(-MAX_SKIP);
}

export function skipQuery(skip: string[]): string {
  return skip.length ? `&skip=${skip.join(".")}` : "";
}

// Owns the data-saver cookie, mirroring lib/hindiToggle.ts: the server stamps
// data-saver="on" on <html>, and client code that runs later (the recorder)
// reads it from there instead of every page passing a prop down.
//
// What data saver does today, honestly: new recordings are made at a lower
// quality, so they upload faster on patchy mobile data. It does NOT change how
// teacher audits or decks are streamed.

export const DATA_SAVER_COOKIE = "saver";

/// Only "on" means anything; any other cookie value is treated as off.
export function saverAttrFromCookie(value: string | undefined): "on" | undefined {
  return value === "on" ? "on" : undefined;
}

/// Capture limits used when data saver is on. 480p at 15 fps and a few hundred
/// kbit/s is still clear enough for a teacher to judge speech and gesture.
export const SAVER_VIDEO = { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } } as const;
export const SAVER_BITRATE = { audioBitsPerSecond: 32_000, videoBitsPerSecond: 500_000 } as const;

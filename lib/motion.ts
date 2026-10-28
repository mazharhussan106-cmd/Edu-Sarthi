// Owns the "reduce motion" cookie, mirroring lib/hindiToggle.ts: the server
// stamps data-motion="reduce" on <html>, so the very first card on a page load
// already knows not to turn (CardSurface) and CSS cuts other movement
// (globals.css).
//
// It deliberately does NOT hold the saved preference. That lives in the
// preferences JSON; this cookie is the per-device copy the server can read,
// kept in line with the account by PrefSync.

export const MOTION_COOKIE = "motion";

/// Only "reduce" means anything; any other cookie value is normal motion.
export function motionAttrFromCookie(value: string | undefined): "reduce" | undefined {
  return value === "reduce" ? "reduce" : undefined;
}

// Owns the "hide Hindi meanings" cookie, mirroring lib/textSize.ts: the server
// stamps data-hindi="off" on <html> so a student who hides Hindi never sees it
// flash for a frame before the page loads.
//
// It deliberately does NOT remove Hindi from the data. The boxes stay in the
// page and CSS hides them (see globals.css), so turning it back on needs no
// reload and the card fitter simply measures the shorter card.

export const HINDI_COOKIE = "hindi";

/// Only "off" means anything; any other cookie value is shown as normal.
export function hindiAttrFromCookie(value: string | undefined): "off" | undefined {
  return value === "off" ? "off" : undefined;
}

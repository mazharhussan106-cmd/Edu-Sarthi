// Mirrors lib/theme.ts: a cookie-backed preference that must be known before
// first paint, so it's read in app/layout.tsx and stamped onto <html> there
// rather than applied client-side after hydration (which would flash).

export const TEXT_SIZE_COOKIE = "textSize";

export function isLargerText(value: string | undefined): boolean {
  return value === "large";
}

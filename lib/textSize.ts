// Owns the text-size choice (small / normal / large) and its cookie, mirroring
// lib/theme.ts: it must be known on the server so <html> carries the right
// attribute in the first paint, or the page would jump size after loading.
//
// It deliberately does NOT hold the saved preference. The stored copy lives in
// the user's preferences JSON (lib/preferences.ts). This cookie is only the
// per-device copy the server render can read, and it is written when the
// setting is changed on that device, so a new device starts at the default
// until the student changes it there.

export const TEXT_SIZE_COOKIE = "textSize";

export const TEXT_SIZES = [
  { value: "small", label: "A−" },
  { value: "normal", label: "A" },
  { value: "large", label: "A+" },
] as const;

export type TextSize = (typeof TEXT_SIZES)[number]["value"];

export const TEXT_SIZE_VALUES = ["small", "normal", "large"] as const;

/// The cookie is user-writable, so its value is checked, not trusted. Normal
/// is the CSS default, so it returns undefined and the attribute is omitted.
export function textAttrFromCookie(value: string | undefined): "small" | "large" | undefined {
  return value === "small" || value === "large" ? value : undefined;
}

/// Larger text also raises the smallest size a card side may shrink to.
export function cardFloorScale(attr: string | undefined): number {
  return attr === "large" ? 1.2 : 1;
}

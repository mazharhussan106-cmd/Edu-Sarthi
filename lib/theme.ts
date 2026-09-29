// Owns the theme list and the mapping between the database enum (LIGHT) and
// the CSS attribute value (data-theme="light"). Both directions live here so
// adding a theme is one edit, not four.
//
// It deliberately does NOT read or write the theme. Storage is split — a
// cookie for the server render, a database column for persistence across
// devices — and both are handled at the boundary that owns them.

import type { Theme } from "@prisma/client";

/// Order here is the order shown in the settings picker.
export const THEMES = [
  { value: "LIGHT", attr: "light", label: "Light" },
  { value: "DARK", attr: "dark", label: "Dark" },
  { value: "SEPIA", attr: "sepia", label: "Sepia" },
  { value: "MIDNIGHT", attr: "midnight", label: "Midnight" },
  { value: "HIGH_CONTRAST", attr: "high-contrast", label: "High contrast" },
] as const satisfies readonly { value: Theme; attr: string; label: string }[];

export const THEME_COOKIE = "theme";

/// The cookie is user-writable, so its value is checked against the list
/// rather than trusted. Anything unrecognised falls back to light instead of
/// writing a data-theme no stylesheet answers to.
export function attrFromCookie(value: string | undefined): string | undefined {
  const match = THEMES.find((t) => t.attr === value);
  // Light lives on :root, so the attribute is omitted rather than set.
  return match && match.attr !== "light" ? match.attr : undefined;
}

export function themeFromCookie(value: string | undefined): Theme {
  return THEMES.find((t) => t.attr === value)?.value ?? "LIGHT";
}

export function attrFromTheme(theme: Theme): string {
  return THEMES.find((t) => t.value === theme)?.attr ?? "light";
}

export function isTheme(value: unknown): value is Theme {
  return THEMES.some((t) => t.value === value);
}

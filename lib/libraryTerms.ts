// Owns the public library's terms: which licence a deck is published under,
// which version of the terms a creator agreed to, and the credit line shown
// with a public deck ("by Asha K.", "by an EduSarthi learner", "EduSarthi").
// Kept free of database code so the submit form and the pages share it.
//
// It deliberately does NOT decide who may publish or save anything — the
// 18+ and tick-box checks run in lib/deckReview, the input rules live in
// lib/deckSchemas.

import type { CreditStyle, Role } from "@prisma/client";

/// Bump when the wording of the library rules or the "Decks you publish" part
/// of the Terms changes in a way creators must agree to again.
export const LIBRARY_TERMS_VERSION = "2026-10-27";

/// Students' and teachers' decks are CC BY-SA 4.0 (owner's decision). Decks
/// made by EduSarthi's own admins stay EduSarthi's: they are the material for
/// paid features, so they are not given away for anyone to resell.
export const LICENCES = {
  CC_BY_SA: { id: "CC-BY-SA-4.0", label: "CC BY-SA 4.0", href: "https://creativecommons.org/licenses/by-sa/4.0/" },
  EDUSARTHI: { id: "EDUSARTHI", label: "© EduSarthi", href: null },
} as const;

export function licenceFor(role: Role): string {
  return role === "ADMIN" ? LICENCES.EDUSARTHI.id : LICENCES.CC_BY_SA.id;
}

/// Null when the deck predates the terms: showing a licence the owner never
/// agreed to would be a promise we cannot make.
export function licenceInfo(licence: string | null): { label: string; href: string | null } | null {
  if (licence === LICENCES.CC_BY_SA.id) return LICENCES.CC_BY_SA;
  if (licence === LICENCES.EDUSARTHI.id) return LICENCES.EDUSARTHI;
  return null;
}

/// What gets a deck rejected or taken down. One list for the public rules page
/// and the admin's review checklist, so the admin never judges by rules the
/// creator could not read.
export const LIBRARY_RULES: { title: string; detail: string }[] = [
  { title: "Your own work, or shared with permission", detail: "No pages copied from textbooks, guidebooks or paid courses, and no one else's deck presented as yours. If you built on another library deck, say so in the description." },
  { title: "Correct", detail: "Answers, meanings and examples are right. A deck that teaches mistakes is rejected." },
  { title: "No personal details", detail: "No phone numbers, home addresses, email addresses, ID numbers, or photos of people who did not agree to it — yours included." },
  { title: "Respectful", detail: "Nothing hateful, sexual, violent or harassing, and nothing aimed at a real person." },
  { title: "Not an advert", detail: "No ads, selling, referral codes, or links that lead somewhere to buy." },
  { title: "AI cards checked by you", detail: "Cards the AI helped make are welcome once you have read and corrected them. They keep the AI-assisted label." },
  { title: "A real deck", detail: "At least 3 cards that teach something. Test decks and empty cards are rejected." },
];

export const CREDIT_CHOICES: { value: CreditStyle; label: string }[] = [
  { value: "FULL_NAME", label: "My full name" },
  { value: "FIRST_NAME", label: "My first name only" },
  { value: "DISPLAY_NAME", label: "A display name I type" },
  { value: "NONE", label: "No name" },
];

/// What a Prisma query needs to select on the owner to build a credit line.
export const CREDIT_SELECT = { role: true, name: true, creditStyle: true, publicName: true } as const;

export type CreditOwner = { role: Role; name: string | null; creditStyle: CreditStyle | null; publicName: string | null };

/// The name shown after "by". Null when the owner has never chosen (decks
/// approved before the terms), so nothing about them is shown by default.
export function creditName(owner: CreditOwner): string | null {
  if (owner.role === "ADMIN") return "EduSarthi";
  const anonymous = owner.role === "TEACHER" ? "an EduSarthi teacher" : "an EduSarthi learner";
  const name = owner.name?.trim() ?? "";
  switch (owner.creditStyle) {
    case null:
      return null;
    case "FULL_NAME":
      return name || anonymous;
    case "FIRST_NAME":
      return name.split(/\s+/)[0] || anonymous;
    // An admin clearing an unacceptable display name leaves the deck credited
    // anonymously rather than to nothing.
    case "DISPLAY_NAME":
      return owner.publicName?.trim() || anonymous;
    case "NONE":
      return anonymous;
  }
}

/// What the creator sees in the form before they submit, so the choice is
/// made with the real result in front of them.
export function creditPreview(style: CreditStyle, name: string | null, publicName: string, role: Role): string {
  return creditName({ role, name, creditStyle: style, publicName }) ?? "";
}

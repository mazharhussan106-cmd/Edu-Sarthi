// Owns the student app's top-level destinations. The desktop header and the
// mobile bottom bar both read this list, so the two can never disagree about
// what "Learn" points at.
//
// It deliberately holds no icons. Icons are React components, and this file
// is imported by server layouts that should not pull in client code.

import type { NavLink } from "@/components/layout/NavLinks";

export const STUDENT_LINKS: readonly NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/flashcards", label: "Flashcard" },
  { href: "/feedback", label: "Audited" },
  { href: "/class", label: "Class" },
  { href: "/profile", label: "Profile" },
];

export type MenuGroup = { heading: string; items: readonly NavLink[] };

/// The menu (hamburger) sections, below the primary links. Kept apart from
/// STUDENT_LINKS so the bottom bar and header row stay at five destinations;
/// everything else lives here, each group folded under its heading until
/// tapped (MobileMenu).
///
/// A function, not a constant, because some links depend on the server, so
/// the menu never offers a dead end:
/// - `member` is false for a guest. Guests cannot make decks or publish, so
///   New deck and "How my name shows on public decks" are left out for them.
/// - `aiCards` is whether the AI card maker's key is set.
export function studentMore({ member, aiCards }: { member: boolean; aiCards: boolean }): readonly MenuGroup[] {
  return [
    {
      heading: "Today",
      items: [
        { href: "/today", label: "Today's review" },
        // The In review tab is exactly Pending + In review: sent, not yet audited.
        { href: "/feedback?f=review", label: "Waiting for audit" },
        { href: "/notices", label: "Notices" },
      ],
    },
    {
      heading: "Study",
      items: [
        { href: "/explore", label: "Explore flashcards" },
        { href: "/flashcards/sections", label: "Word sections (level, topic, goal)" },
        { href: "/flashcards?kind=support", label: "Customer-support English" },
        { href: "/modules", label: "Practice modules" },
      ],
    },
    {
      heading: "Make your own",
      items: [
        { href: "/decks", label: "My decks" },
        ...(member ? [{ href: "/decks#new-deck", label: "New deck" }] : []),
        ...(member && aiCards ? [{ href: "/decks#ai-cards", label: "Make cards with AI" }] : []),
        { href: "/my-cards", label: "Saved cards" },
        { href: "/my-cards?list=unknown", label: "Cards I find hard" },
      ],
    },
    {
      heading: "Decks from others",
      items: [
        // ?shared=1 and ?following=1 make those sections show even when they
        // are empty, so the link never lands on a page with nothing about them.
        { href: "/decks?shared=1#shared-with-me", label: "Shared with me" },
        { href: "/decks?following=1#following", label: "Decks I follow" },
        { href: "/library", label: "Library" },
        { href: "/institute", label: "Institute" },
      ],
    },
    {
      heading: "You",
      items: [
        { href: "/progress", label: "Progress and reports" },
        { href: "/history", label: "History" },
        { href: "/settings", label: "Settings" },
        ...(member ? [{ href: "/settings#public-name", label: "How my name shows on public decks" }] : []),
        { href: "/settings#share", label: "Share EduSarthi" },
        { href: "/profile#your-data", label: "Download or delete my data" },
      ],
    },
    {
      heading: "Help",
      items: [
        { href: "/help", label: "Help and FAQ" },
        { href: "/support", label: "Contact support" },
      ],
    },
    {
      heading: "About",
      items: [
        { href: "/about", label: "About EduSarthi" },
        { href: "/legal/terms", label: "Terms" },
        { href: "/legal/privacy", label: "Privacy" },
        { href: "/legal/library-rules", label: "Library rules" },
      ],
    },
  ];
}

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
/// everything else lives one tap away here.
export const STUDENT_MORE: readonly MenuGroup[] = [
  {
    heading: "Study",
    items: [
      { href: "/explore", label: "Explore flashcards" },
      { href: "/modules", label: "Practice modules" },
      { href: "/decks", label: "My decks" },
      { href: "/library", label: "Library" },
      { href: "/institute", label: "Institute" },
    ],
  },
  {
    heading: "You",
    items: [
      { href: "/progress", label: "Progress and reports" },
      { href: "/settings", label: "Settings" },
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
    ],
  },
];

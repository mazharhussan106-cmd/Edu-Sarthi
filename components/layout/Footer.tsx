// Owns the site footer: brand blurb, one horizontal link row, legal line.
//
// It deliberately does NOT vary by role. A footer that changes as you move
// between the student and teacher areas reads as a different site.

import Link from "next/link";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/support", label: "Support" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/terms", label: "Terms" },
] as const;

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <div>
          <p className="font-display text-base font-bold text-ink">Edusarthi</p>
          <p className="mt-1 max-w-md text-xs text-ink-muted">
            Spoken English practice with a written audit from a teacher —
            pronunciation, grammar, fluency, vocabulary and confidence, scored
            and annotated.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-ink-muted hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-xs text-mist">
          © {new Date().getFullYear()} Edusarthi. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

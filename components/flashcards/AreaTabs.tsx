// Owns layer 1 of the study filters: the student's study tabs with an
// underline — English (the built-in cards on the Flashcard tab), Tech (every
// tech deck they can see), My decks, and the tabs the student made and filled
// with decks — in the student's order,
// then ＋ to make or arrange tabs (owner's decisions 9–12,
// docs/FLASHCARD-NAV-LAYERS.md). Shown on top of the Flashcard tab, My decks
// and every own tab, so moving between them keeps the row in place. The page
// may put a short read-out at the right end (the Flashcard tab: today's count).
//
// A hidden tab is left out, except while the student is on its page: the
// bottom bar's Flashcard button always opens English, and a row that shows no
// current tab would leave them unsure where they are.
//
// If the tabs cannot be read (Database setup has not made the tables yet), it
// falls back to the built-in tabs rather than breaking the Flashcard tab.
// Guests, teachers and admins get the built-in tabs and no ＋. Links, not
// role="tablist": each tab is its own page with its own URL.

import Link from "next/link";
import type { ReactNode } from "react";

import { ArrangeTabs } from "@/components/tabs/ArrangeTabs";
import { auth } from "@/lib/auth";
import { TAB_LIMITS } from "@/lib/studyTabSchemas";
import { tabsFor, type TabView } from "@/lib/studyTabs";
import { cn } from "@/lib/utils";

const DEFAULT_TABS: TabView[] = [
  { key: "english", label: "English", href: "/flashcards", hidden: false, own: false },
  { key: "tech", label: "Tech", href: "/tech", hidden: false, own: false },
  { key: "decks", label: "My decks", href: "/decks", hidden: false, own: false },
];

export async function AreaTabs({ current, aside }: { current: string; aside?: ReactNode }) {
  const session = await auth();
  const user = session?.user;
  const canArrange = Boolean(user && user.role === "STUDENT" && !user.isGuest);
  let tabs = DEFAULT_TABS;
  if (canArrange) {
    try {
      tabs = await tabsFor(user!.id);
    } catch (e) {
      // Logged, not shown: the student still gets a working bar.
      console.error("Study tabs could not be read; showing the default tabs.", e);
    }
  }
  const shown = tabs.filter((t) => !t.hidden || t.key === current);

  return (
    // The row's bottom line is an inset shadow, not a border: the tabs scroll,
    // and a scrolling box cannot let a tab's underline overlap its border.
    <div className="flex items-center gap-1.5 shadow-[inset_0_-1px_0_var(--color-border)]">
      <nav
        aria-label="Study area"
        className="flex min-w-0 flex-1 gap-1 overflow-x-auto pr-6 [mask-image:linear-gradient(to_right,black_calc(100%-1.5rem),transparent)] [scrollbar-width:none]"
      >
        {shown.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            aria-current={t.key === current ? "page" : undefined}
            className={cn(
              // The focus ring is drawn inside the tab: outside, the scrolling
              // row would cut it off.
              "flex min-h-8 max-w-[11rem] shrink-0 items-center border-b-2 px-2.5 font-display text-sm font-bold focus-visible:outline-offset-[-2px]",
              t.key === current ? "border-accent text-accent" : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            <span className="truncate">{t.label}</span>
          </Link>
        ))}
      </nav>
      {canArrange ? (
        <ArrangeTabs tabs={tabs.map(({ key, label, hidden, own }) => ({ key, label, hidden, own }))} canCreate={tabs.filter((t) => t.own).length < TAB_LIMITS.ownTabs} />
      ) : null}
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>
  );
}

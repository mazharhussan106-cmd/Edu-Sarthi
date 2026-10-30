// Owns the Tech tab: the study tabs on top (Tech current), then layer 2 — the
// tech subjects that have decks (All · Programming · Data · …, with counts) —
// then every tech deck the student can see in two lists: the ones they study
// (their own, shared with them, followed: Study) and the rest of the library
// and their institute (Open, where they can follow or copy).
//
// Which decks are tech, and which the student may see, is lib/techDecks; this
// page only lays them out. It deliberately does NOT follow or copy from here:
// those stay on the deck's own page, with its credit, licence and reports.
// /tech?s=data shows one subject; an unknown subject shows all.

import Link from "next/link";

import { AreaTabs } from "@/components/flashcards/AreaTabs";
import { FADE_ROW } from "@/components/flashcards/fadeRow";
import { DeckCredit } from "@/components/decks/DeckCredit";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { auth } from "@/lib/auth";
import { isTechSubject, TECH_SUBJECTS, techDecks, type TechDeck } from "@/lib/techDecks";
import { cn } from "@/lib/utils";

export const revalidate = 0;

const chip = "shrink-0 rounded-full border px-3 py-1 text-[13px] font-medium";
const HOW: Record<TechDeck["how"], string | null> = { own: "yours", shared: "shared with you", following: "following", institute: "your institute", library: null };

function Row({ d }: { d: TechDeck }) {
  const study = d.how === "own" || d.how === "shared" || d.how === "following";
  return (
    <li>
      <Card className="flex items-center justify-between gap-3 p-4">
        <Link href={d.href} className="min-w-0 flex-1 rounded-lg hover:underline">
          <span className="block truncate font-display font-bold text-ink">{d.title}</span>
          {d.how === "own" ? null : <DeckCredit owner={d.owner} institute={d.institute} className="truncate" />}
          <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs text-ink-muted">{d.cards} cards</span>
            <span className="text-xs text-ink-muted">· {d.subjects.map((s) => TECH_SUBJECTS.find((t) => t.key === s)!.label).join(" · ")}</span>
            {HOW[d.how] ? <Badge>{HOW[d.how]}</Badge> : null}
            {study && d.available && d.due ? <Badge variant="accent">{d.due} due</Badge> : null}
            {d.available ? null : <Badge>not available now</Badge>}
          </span>
        </Link>
        <Link
          href={d.href}
          aria-label={`${study ? "Study" : "Open"} ${d.title}`}
          className={cn(
            "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium",
            study ? "bg-accent text-on-accent hover:bg-accent-dark" : "border border-border-strong text-ink hover:bg-hover",
          )}
        >
          {study ? "Study" : "Open"}
        </Link>
      </Card>
    </li>
  );
}

export default async function TechPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const [sp, session] = await Promise.all([searchParams, auth()]);
  const all = await techDecks(session!.user.id);
  const subject = isTechSubject(sp.s) ? sp.s : null;
  const counts = new Map(TECH_SUBJECTS.map((t) => [t.key, all.filter((d) => d.subjects.includes(t.key)).length]));
  const shown = subject ? all.filter((d) => d.subjects.includes(subject)) : all;
  const mine = shown.filter((d) => d.how === "own" || d.how === "shared" || d.how === "following");
  const more = shown.filter((d) => d.how === "library" || d.how === "institute");
  const label = subject ? TECH_SUBJECTS.find((t) => t.key === subject)!.label : null;

  return (
    <main className="mx-auto max-w-2xl px-3 pb-6 pt-3 sm:px-6 sm:pt-6">
      <h1 className="sr-only">Tech decks{label ? ` · ${label}` : ""}</h1>
      <AreaTabs current="tech" />

      {all.length ? (
        <nav aria-label="Tech subject" className={cn("mt-1 flex gap-1.5 overflow-x-auto", FADE_ROW)}>
          {[{ key: null, label: "All", n: all.length }, ...TECH_SUBJECTS.filter((t) => counts.get(t.key)).map((t) => ({ key: t.key, label: t.label, n: counts.get(t.key)! }))].map((t) => (
            <Link
              key={t.key ?? "all"}
              href={t.key ? `/tech?s=${t.key}` : "/tech"}
              aria-current={subject === t.key ? "page" : undefined}
              className={cn(chip, subject === t.key ? "border-accent bg-accent text-on-accent" : "border-border-strong text-ink hover:bg-hover")}
            >
              {t.label} <span className="font-mono text-xs opacity-80">{t.n}</span>
            </Link>
          ))}
        </nav>
      ) : null}

      {mine.length ? (
        <section aria-labelledby="tech-mine" className="mt-3">
          <h2 id="tech-mine" className="font-display text-base font-bold text-ink">Your tech decks</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {mine.map((d) => <Row key={d.id} d={d} />)}
          </ul>
        </section>
      ) : null}

      {more.length ? (
        <section aria-labelledby="tech-more" className="mt-5">
          <h2 id="tech-more" className="font-display text-base font-bold text-ink">More in the library</h2>
          <p className="text-xs text-ink-muted">Open one to follow it (study it as its author keeps it) or make your own copy.</p>
          <ul className="mt-2 flex flex-col gap-2">
            {more.map((d) => <Row key={d.id} d={d} />)}
          </ul>
        </section>
      ) : null}

      {all.length ? null : (
        <Card className="mt-4 text-center text-sm text-ink-muted">
          No tech decks yet. Decks about programming, data, infrastructure, cloud or AI show here. Make one in{" "}
          <Link href="/decks#new-deck" className="font-medium text-accent hover:underline">My decks</Link> (tag it, for example, python or sql), or find one in the{" "}
          <Link href="/library" className="font-medium text-accent hover:underline">Library</Link>.
        </Card>
      )}
    </main>
  );
}

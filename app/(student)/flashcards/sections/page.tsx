// Owns the Word sections screen: the 2,227 built-in words split four ways —
// by level, by topic, by word type and by importance — each tile showing how
// many words it holds and how many the student already knows.
//
// A section is only a filter on the daily Words session; tapping one opens its
// packs. It deliberately lists nothing but built-in words, so student-made and
// imported decks never appear here.

import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { prefsOf } from "@/lib/preferences";
import { Card } from "@/components/ui/Card";
import { FAMILIES, sectionStats, trackForGoal, type SectionStat } from "@/lib/wordSections";

export const revalidate = 0;

const n = (x: number) => x.toLocaleString("en-IN");

function Tile({ s }: { s: SectionStat }) {
  const pct = s.total ? Math.round((s.known / s.total) * 100) : 0;
  return (
    <Link href={`/flashcards/sections/${s.key}`} className="block h-full">
      <Card className="h-full p-3 hover:bg-hover">
        <p className="font-display text-sm font-bold text-ink">{s.label}</p>
        <p className="text-xs text-ink-muted">{s.hint}</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-dim" role="img" aria-label={`${s.known} of ${s.total} known`}>
          <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 font-mono text-xs text-ink-muted">
          <b className="text-ink">{n(s.known)}</b> / {n(s.total)} known
        </p>
      </Card>
    </Link>
  );
}

export default async function SectionsPage() {
  const session = await auth();
  const userId = session!.user.id;
  const [{ stats, total, known }, me] = await Promise.all([
    sectionStats(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } }),
  ]);
  // The track that matches the goal chosen on the profile, if there is one.
  const mine = trackForGoal(prefsOf(me?.preferences).goal);
  const mineStat = mine ? stats.find((s) => s.key === mine.key) : null;

  return (
    <main className="mx-auto max-w-2xl px-3 pb-8 pt-3 sm:px-6 sm:pt-6">
      <Link href="/flashcards?kind=words" className="text-sm font-medium text-accent hover:underline">← Words</Link>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink">Word sections</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Pick a way to study {n(total)} words. Each section is cut into packs of 50, so you can see how far you have come.
      </p>

      <Link href="/flashcards?kind=words" className="mt-4 block">
        <Card className="flex items-center justify-between p-3 hover:bg-hover">
          <span>
            <span className="block font-display text-sm font-bold text-ink">All words together</span>
            <span className="text-xs text-ink-muted">The usual daily session, in learning order</span>
          </span>
          <span className="font-mono text-xs text-ink-muted"><b className="text-ink">{n(known)}</b> / {n(total)}</span>
        </Card>
      </Link>

      {mineStat ? (
        <section aria-labelledby="for-you" className="mt-6">
          <h2 id="for-you" className="font-display text-lg font-bold text-ink">For your goal</h2>
          <div className="mt-2"><Tile s={mineStat} /></div>
        </section>
      ) : (
        <p className="mt-4 text-sm text-ink-muted">
          Tell us what you are practising for in <Link href="/profile" className="font-medium text-accent hover:underline">Profile</Link> and we will suggest a goal track here.
        </p>
      )}

      {FAMILIES.map((f) => {
        const tiles = stats.filter((s) => s.family === f.value);
        return (
          <section key={f.value} aria-labelledby={`fam-${f.value}`} className="mt-6">
            <h2 id={`fam-${f.value}`} className="font-display text-lg font-bold text-ink">{f.title}</h2>
            <p className="text-sm text-ink-muted">{f.blurb}</p>
            {f.value === "goal" ? (
              <p className="mt-1 text-xs text-ink-muted">
                Chosen by EduSarthi from topic, level and importance. These are study paths, not an official exam or employer word list.
              </p>
            ) : null}
            <ul className="mt-2 grid grid-cols-2 gap-2">
              {tiles.map((s) => (
                <li key={s.key}><Tile s={s} /></li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}

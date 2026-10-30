// Owns one library deck: its cards, "Copy to my decks", like, and the report
// button. Open to a visitor who is not signed in (proxy.ts PUBLIC_LIBRARY): they
// read the whole deck, and every action that needs an account shows a sign-in
// link instead.
//
// Only a listed deck resolves (lib/decks LISTED); any other id is a 404,
// whatever state it is really in. Studying happens by following (./study, the original with
// the learner's own progress) or on a copy; this page never changes the deck.
//
// Cost on a slow phone: the deck's cards are first read as id, title and topic
// only. An imported deck (hundreds of cards, each with dozens of fields) is
// listed from that alone and each card opens on its own page; a hand-made deck
// loads full cards a page at a time.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canonical } from "@/lib/siteUrl";
import { isRecordId, queryPage } from "@/lib/libraryUrl";
import { AI_CARD_FILTER, CARD_SELECT, LISTED, faceCard } from "@/lib/decks";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { AiBadge } from "@/components/decks/AiBadge";
import { CardBack, CardFront } from "@/components/decks/CardFace";
import { CopyDeckButton } from "@/components/decks/CopyDeckButton";
import { DeckCredit } from "@/components/decks/DeckCredit";
import { CREDIT_INSTITUTE_SELECT, CREDIT_SELECT, SOURCE_SELECT, copiedFrom } from "@/lib/libraryTerms";
import { isFollowing } from "@/lib/deckFollow";
import { FollowButton } from "@/components/decks/FollowButton";
import { LikeButton } from "@/components/decks/LikeButton";
import { ReportButton } from "@/components/decks/ReportButton";

export const revalidate = 0;

const PAGE = 25;

// One read serves the page and its metadata: the live pool has a single
// connection, so asking twice per request would queue.
const getDeck = cache(async (id: string) =>
  // A segment that cannot be an id never reaches the database: a NUL byte in
  // one made Postgres throw, and the visitor saw an error, not "not found".
  !isRecordId(id) ? null : prisma.deck.findFirst({
    where: { id, ...LISTED },
    select: { title: true, description: true, tags: true, ownerId: true, licence: true, ...SOURCE_SELECT, ...CREDIT_INSTITUTE_SELECT, owner: { select: { ...CREDIT_SELECT, teacherVerifiedAt: true } }, members: { where: { role: "EDIT", acceptedAt: { not: null }, termsAcceptedAt: { not: null } }, select: { user: { select: CREDIT_SELECT } } }, _count: { select: { likes: true, cards: true } } },
  }),
);

// What a search result and a shared link show. It names the deck and what is
// in it, never the creator: the page credits them as they chose, but a title
// or description is copied into places they never agreed to. Pages 2 and on of
// a long deck are listed only through the first page.
export async function generateMetadata({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string | string[] }> }): Promise<Metadata> {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const deck = await getDeck(id);
  if (!deck) return { robots: { index: false } };
  const about = deck.description?.trim();
  const description = about
    ? about.length > 155 ? `${about.slice(0, 154)}…` : about
    : `${deck._count.cards} flashcards in the EduSarthi library${deck.tags.length ? `: ${deck.tags.join(", ")}` : ""}.`;
  const title = `${deck.title} — EduSarthi`;
  return {
    title,
    description,
    ...canonical(`/library/${id}`),
    ...(queryPage(sp.page) > 1 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function LibraryDeckPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string | string[] }> }) {
  const [{ id }, sp, session] = await Promise.all([params, searchParams, auth()]);
  const deck = await getDeck(id);
  if (!deck) notFound();

  const index = await prisma.word.findMany({ where: { deckId: id }, orderBy: { serial: "asc" }, select: { id: true, text: true, category: true } });
  // Imported cards carry their topic in `category`; hand-made cards do not.
  const imported = index.some((c) => c.category);
  const page = Math.max(1, Math.min(Math.ceil(index.length / PAGE), queryPage(sp.page)));
  const pageIds = index.slice((page - 1) * PAGE, page * PAGE).map((c) => c.id);
  const full = imported ? [] : await Promise.all((await prisma.word.findMany({ where: { id: { in: pageIds }, deckId: id }, orderBy: { serial: "asc" }, select: CARD_SELECT })).map(faceCard));

  const topics = new Map<string, { id: string; text: string }[]>();
  if (imported) for (const c of index) topics.set(c.category ?? "Cards", [...(topics.get(c.category ?? "Cards") ?? []), { id: c.id, text: c.text }]);

  // Which cards the AI helped make: ids only, so an imported deck's heavy
  // card data is still never loaded just to draw the list.
  const aiIds = new Set((await prisma.word.findMany({ where: { deckId: id, ...AI_CARD_FILTER }, select: { id: true } })).map((c) => c.id));
  const aiCount = aiIds.size;
  const signedIn = Boolean(session?.user?.id);
  const own = deck.ownerId === session?.user?.id;
  const liked = session?.user?.id ? (await prisma.deckLike.count({ where: { deckId: id, userId: session.user.id } })) > 0 : false;
  const following = session?.user?.id ? await isFollowing(session.user.id, id) : false;
  // Recording for the teacher is offered on a verified teacher's deck, to students.
  const canRecord = session?.user?.role === "STUDENT" && deck.owner.role === "TEACHER" && Boolean(deck.owner.teacherVerifiedAt);

  return (
    <main className="mx-auto max-w-2xl px-3 pb-8 pt-3 sm:px-6 sm:pt-6">
      <Link href="/library" className="text-sm font-medium text-accent hover:underline">← Library</Link>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink">{deck.title}</h1>
      {deck.description ? <p className="mt-1 text-sm text-ink-muted">{deck.description}</p> : null}
      <DeckCredit owner={deck.owner} institute={deck.institute} contributors={deck.members.flatMap((m) => (m.user ? [m.user] : []))} licence={deck.licence} source={copiedFrom(deck)} linked className="mt-1" />
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-xs text-ink-muted">{index.length} cards</span>
        {deck.owner.role === "TEACHER" && deck.owner.teacherVerifiedAt ? <Badge variant="success">Verified teacher</Badge> : null}
        {deck.owner.role === "ADMIN" ? <Badge variant="accent">EduSarthi</Badge> : null}
        {aiCount ? <AiBadge label={`${aiCount} of ${index.length} cards AI-assisted`} /> : null}
        {deck.tags.map((t) => <Link key={t} href={`/library?tag=${encodeURIComponent(t)}`}><Badge>{t}</Badge></Link>)}
      </div>
      <div className="mt-4 flex flex-wrap items-start gap-3">
        {signedIn ? (
          <>
            {own ? null : <FollowButton deckId={id} following={following} />}
            <CopyDeckButton deckId={id} signedIn label="Make my own copy" variant={own ? undefined : "outline"} />
          </>
        ) : (
          // One call to action, not Follow and Copy each asking to sign in.
          <Link href="/login" className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-dark">
            Sign in to study or copy this deck
          </Link>
        )}
        <LikeButton deckId={id} likes={deck._count.likes} liked={liked} disabled={own} signedIn={signedIn} />
        {own ? null : <ReportButton deckId={id} signedIn={signedIn} />}
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        {signedIn
          ? "Following keeps you on the author’s latest version, with your own progress. A copy is yours to change, and never updates."
          : "With an account you can follow this deck and study it with your own progress, or make a copy to change."}
      </p>

      {imported ? (
        <div className="mt-5 flex flex-col gap-5">
          {[...topics].map(([topic, rows]) => (
            <section key={topic} aria-label={topic}>
              <h2 className="font-display text-sm font-bold text-ink">{topic}</h2>
              <ul className="mt-2 flex flex-col gap-1.5">
                {rows.map((c) => (
                  <li key={c.id}>
                    <Link href={`/library/${id}/card/${c.id}`} className="block">
                      <Card className="flex items-center justify-between gap-2 p-3 hover:bg-hover">
                        <span className="min-w-0 truncate font-medium text-ink">{c.text}</span>
                        {aiIds.has(c.id) ? <AiBadge /> : null}
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <>
          <ul className="mt-5 flex flex-col gap-3">
            {full.map((c) => (
              <li key={c.id}>
                <Card className="flex flex-col gap-3 p-4">
                  <CardFront card={c} />
                  <hr className="border-border" />
                  <CardBack card={c} />
                  {canRecord ? (
                    <Link href={`/library/${id}/practice/${c.id}`} className="inline-flex h-9 w-fit items-center rounded-lg border border-border-strong px-3 text-sm text-ink hover:bg-hover">
                      🎙 Record yourself — the teacher will audit it
                    </Link>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
          {index.length > PAGE ? (
            <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-sm">
              {page > 1 ? <Link href={`/library/${id}?page=${page - 1}`} className="text-accent hover:underline">← Earlier cards</Link> : <span />}
              <span className="font-mono text-xs text-ink-muted">{page} / {Math.ceil(index.length / PAGE)}</span>
              {page * PAGE < index.length ? <Link href={`/library/${id}?page=${page + 1}`} className="text-accent hover:underline">More cards →</Link> : <span />}
            </nav>
          ) : null}
        </>
      )}
    </main>
  );
}

// Owns the deck editor: the deck's details, its cards, the form for a new
// card, the study button, and the share and delete actions. A published deck
// shows small-fix Edit only and "Start a new version"; a new version (working
// copy) is edited freely under a banner (components/decks/VersionPanel).
//
// Scoped by owner in the query — another student's deck id is a 404 here, not
// a page that fetches and then refuses.
// It deliberately does NOT run a study session (./study).

import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CARD_SELECT, deckStudyCounts, faceCard, isStaff } from "@/lib/decks";
import { DECK_LIMITS } from "@/lib/deckSchemas";
import { Card } from "@/components/ui/Card";
import { AiCardsPanel } from "@/components/decks/AiCardsPanel";
import { cardMakerEnabled } from "@/lib/aiEnabled";
import { CardEditor } from "@/components/decks/CardEditor";
import { CardRow } from "@/components/decks/CardRow";
import { ChapterIndex } from "@/components/decks/ChapterIndex";
import { DeckActions } from "@/components/decks/DeckActions";
import { DeckForm } from "@/components/decks/DeckForm";
import { activeMembership } from "@/lib/institutes";
import { PublishPanel } from "@/components/decks/PublishPanel";
import { VersionPanel } from "@/components/decks/VersionPanel";
import { isLive } from "@/lib/deckVersion";
import { istDayStart } from "@/lib/aiLimits";
import { DeckCredit } from "@/components/decks/DeckCredit";
import { LICENCES, SOURCE_SELECT, copiedFrom } from "@/lib/libraryTerms";

export const revalidate = 0;

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, session] = await Promise.all([params, auth()]);
  const userId = session!.user.id;

  const deck = await prisma.deck.findFirst({
    where: { id, ownerId: userId },
    select: { id: true, title: true, description: true, tags: true, shareToken: true, visibility: true, status: true, rejectReason: true, sourceLicence: true, draftOfId: true, draftOf: { select: { id: true, title: true } }, drafts: { select: { id: true, status: true } }, ...SOURCE_SELECT, cards: { orderBy: { serial: "asc" }, select: { ...CARD_SELECT, category: true } } },
  });
  if (!deck) notFound();

  const [counts, staff, me, cards] = await Promise.all([
    deckStudyCounts(userId, id),
    isStaff(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { role: true, name: true, adultConfirmedAt: true, creditStyle: true, publicName: true } }),
    Promise.all(
      deck.cards.map(async (c) => ({
        ...(await faceCard(c)),
        category: c.category,
        imageKey: c.imageUrl,
        audioKey: c.audioUrl,
        videoUrl: c.videoUrl ?? "",
      })),
    ),
  ]);
  if (!me) notFound();
  const live = isLive(deck);
  const draft = deck.drafts[0] ?? null;
  const version = deck.draftOf;
  // Small-fix allowance used today, and fixes an admin undid in the last two
  // weeks (the creator was emailed; this is the note on the deck page).
  const [fixedToday, undone] = live
    ? await Promise.all([
        prisma.deckChange.findMany({ where: { deckId: id, createdAt: { gte: istDayStart() } }, select: { wordId: true } }).then((r) => new Set(r.map((x) => x.wordId)).size),
        prisma.deckChange.findMany({ where: { deckId: id, undone: true, reviewedAt: { gte: new Date(Date.now() - 14 * 86_400_000) } }, orderBy: { reviewedAt: "desc" }, take: 5, select: { id: true, undoReason: true, word: { select: { text: true } } } }),
      ])
    : [0, []];
  // Chapters, in the order their first card was added. A deck with none (a plain
  // hand-made one) keeps the flat list; once any card has one, cards without a
  // chapter sit under "Cards" so nothing disappears from the list.
  const titles = [...new Set(cards.map((c) => c.category))];
  const chaptered = titles.some(Boolean);
  const groups = titles.map((t, i) => ({ anchor: `chapter-${i}`, title: t ?? "Cards", cards: cards.filter((c) => c.category === t) }));
  const member = await activeMembership(userId);
  const studyable = counts.due + counts.fresh;
  // Learners' recordings on this deck's cards, for the teacher who will audit them.
  const [waiting, audited] = staff
    ? await Promise.all([
        prisma.submission.count({ where: { assignedTeacherId: userId, word: { deckId: id }, status: { in: ["PENDING", "IN_REVIEW"] } } }),
        prisma.submission.count({ where: { assignedTeacherId: userId, word: { deckId: id }, status: "REVIEWED" } }),
      ])
    : [0, 0];

  return (
    <main className="mx-auto max-w-2xl px-3 pb-6 pt-3 sm:px-6 sm:pt-6">
      <Link href="/decks" className="text-sm font-medium text-accent hover:underline">← My decks</Link>
      <h1 className="mt-2 font-display text-xl font-bold text-ink">{deck.title}</h1>
      <DeckCredit source={copiedFrom(deck)} linked className="mt-0.5" />
      {deck.sourceLicence === LICENCES.EDUSARTHI.id ? <p className="mt-1 text-xs text-ink-muted">A copy of an EduSarthi deck: yours to study and change, but it cannot be published to the library or shared by link.</p> : null}
      {version ? <div className="mt-3"><VersionPanel mode="draft" deckId={id} liveId={version.id} liveTitle={version.title} /></div> : null}
      {undone.length ? (
        <ul className="mt-3 flex flex-col gap-1 rounded-lg bg-error/12 p-3 text-sm text-ink">
          {undone.map((u) => <li key={u.id}>An admin undid your fix to “{u.word.text}”. Reason: {u.undoReason}</li>)}
        </ul>
      ) : null}

      <Card className="mt-3 flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-ink-muted">
          <b className="font-mono text-ink">{counts.total}</b> cards · <b className="font-mono text-ink">{counts.due}</b> due · <b className="font-mono text-ink">{counts.fresh}</b> new
        </p>
        {version ? (
          <span className="text-sm text-ink-muted">This is a version for editing. Study the published deck.</span>
        ) : studyable > 0 ? (
          <Link href={`/decks/${id}/study`} className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-dark">
            Study now
          </Link>
        ) : (
          <span className="text-sm text-ink-muted">{counts.total === 0 ? "Add a card to start." : "Nothing due. Come back later."}</span>
        )}
      </Card>

      {staff ? (
        <Card className="mt-3 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-ink-muted">
            Learner recordings on this deck: <b className="font-mono text-ink">{waiting}</b> waiting · <b className="font-mono text-ink">{audited}</b> audited
          </p>
          <Link href="/queue" className="text-sm font-medium text-accent hover:underline">Open the review queue</Link>
        </Card>
      ) : null}

      <section className="mt-6" aria-labelledby="cards-h">
        <h2 id="cards-h" className="font-display text-base font-bold text-ink">Cards</h2>
        {chaptered ? (
          <div className="mt-2 flex flex-col gap-5">
            <ChapterIndex chapters={groups.map((g) => ({ anchor: g.anchor, title: g.title, count: g.cards.length }))} />
            {groups.map((g, i) => (
              <section key={g.anchor} id={g.anchor} aria-labelledby={`${g.anchor}-h`} className="scroll-mt-20">
                <h3 id={`${g.anchor}-h`} className="font-display text-sm font-bold text-ink">{i + 1}. {g.title}</h3>
                <ul className="mt-2 flex flex-col gap-2">
                  {g.cards.map((c) => (
                    <li key={c.id}>
                      <Card className="p-3"><CardRow deckId={id} card={c} staff={staff} canEdit={!live || !draft} canDelete={!live} /></Card>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {cards.map((c) => (
              <li key={c.id}>
                <Card className="p-3"><CardRow deckId={id} card={c} staff={staff} canEdit={!live || !draft} canDelete={!live} /></Card>
              </li>
            ))}
          </ul>
        )}
        {!live && counts.total < DECK_LIMITS.cardsPerDeck && cardMakerEnabled() ? <AiCardsPanel deckId={id} /> : null}
        {live ? null : counts.total < DECK_LIMITS.cardsPerDeck ? (
          <Card className="mt-3">
            <h3 className="font-display text-sm font-bold text-ink">Add a card</h3>
            <div className="mt-3"><CardEditor deckId={id} staff={staff} /></div>
          </Card>
        ) : (
          <p className="mt-3 text-sm text-ink-muted">This deck has {DECK_LIMITS.cardsPerDeck} cards, the most allowed. Start a new deck for more.</p>
        )}
      </section>

      <section className="mt-6" aria-labelledby="det-h">
        <h2 id="det-h" className="font-display text-base font-bold text-ink">Deck details</h2>
        <Card className="mt-2">
          {live ? <p className="text-sm text-ink-muted">The name, description and tags of a published deck change in a new version.</p> : <DeckForm deck={{ id, title: deck.title, description: deck.description, tags: deck.tags }} />}
        </Card>
      </section>

      {live ? (
        <section className="mt-6" aria-labelledby="ver-h">
          <h2 id="ver-h" className="sr-only">Changing a published deck</h2>
          <Card><VersionPanel mode="live" deckId={id} draft={draft} fixedToday={fixedToday} /></Card>
        </section>
      ) : null}

      <section className="mt-6" aria-labelledby="pub-h">
        <h2 id="pub-h" className="sr-only">Public library</h2>
        <Card><PublishPanel deckId={id} visibility={deck.visibility} status={deck.status} rejectReason={deck.rejectReason} cardCount={counts.total} canShareInstitute={!version && Boolean(member && member.role !== "STUDENT")} version={Boolean(version)} consent={{ role: me.role, accountName: me.name, adultConfirmed: Boolean(me.adultConfirmedAt), creditStyle: me.creditStyle, publicName: me.publicName }} /></Card>
      </section>

      {version ? null : (
        <section className="mt-6" aria-labelledby="share-h">
          <h2 id="share-h" className="font-display text-base font-bold text-ink">Sharing</h2>
          <Card className="mt-2"><DeckActions deckId={id} shareToken={deck.shareToken} cardCount={counts.total} /></Card>
        </section>
      )}
    </main>
  );
}

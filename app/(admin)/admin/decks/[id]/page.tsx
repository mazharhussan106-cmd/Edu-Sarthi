// Owns one deck's review page for an admin: every card as a learner would see
// it, the open reports, and the decisions — approve or reject (with a reason
// the owner reads), dismiss reports or take the deck down.
//
// It deliberately shows the owner's student ID, not their name or email: the
// decision is about the deck, and the rest of the app keeps names from staff
// the same way. The one exception is the credit line the creator chose to make
// public, which the admin must see to check it. The checklist is the same
// list as the public library rules (lib/libraryTerms).

import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { CARD_SELECT, faceCard } from "@/lib/decks";
import { REPORT_REASONS } from "@/lib/deckSchemas";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { AiBadge } from "@/components/decks/AiBadge";
import { ActionButton } from "@/components/admin/ActionButton";
import { CardBack, CardFront } from "@/components/decks/CardFace";
import { ensureActiveUser } from "@/lib/activeUser";
import { CREDIT_SELECT, LIBRARY_RULES, SOURCE_SELECT, byLine, copiedFrom, licenceInfo } from "@/lib/libraryTerms";
import { versionSummary } from "@/lib/deckVersion";

export const revalidate = 0;

export default async function AdminDeckPage({ params }: { params: Promise<{ id: string }> }) {
  // Re-checked in the page itself: a layout is not re-run on a client-side
  // navigation, and the role in the token can be older than a demotion.
  await ensureActiveUser(["ADMIN"]);
  const { id } = await params;
  const deck = await prisma.deck.findUnique({
    where: { id },
    select: {
      title: true, description: true, tags: true, visibility: true, status: true, rejectReason: true,
      licence: true, termsVersion: true, termsAcceptedAt: true, sourceDeckId: true, draftOfId: true, ...SOURCE_SELECT,
      // A new version goes out under whatever name its live deck is under.
      institute: { select: { name: true, status: true } },
      draftOf: { select: { institute: { select: { name: true, status: true } } } },
      owner: { select: { publicId: true, ...CREDIT_SELECT } },
      members: { where: { role: "EDIT", acceptedAt: { not: null } }, select: { termsAcceptedAt: true, user: { select: { publicId: true } } } },
      cards: { orderBy: { serial: "asc" }, select: CARD_SELECT },
      reports: { where: { resolvedAt: null }, orderBy: { createdAt: "asc" }, select: { id: true, reason: true, note: true } },
    },
  });
  // Admins review what was submitted or reported, not any private deck whose id they hold.
  if (!deck || (deck.visibility !== "PUBLIC" && deck.reports.length === 0)) notFound();

  const cards = await Promise.all(deck.cards.map(faceCard));
  const aiCount = cards.filter((c) => c.aiAssisted).length;
  const pending = deck.visibility === "PUBLIC" && deck.status === "PENDING_REVIEW";
  const published = deck.visibility === "PUBLIC" && deck.status === "APPROVED";
  const institute = deck.draftOfId ? (deck.draftOf?.institute ?? null) : deck.visibility === "PUBLIC" ? deck.institute : null;
  const credit = byLine(deck.owner, institute ? { name: institute.name, logoKey: null } : null);
  // A copy's worth is in what it adds: count its cards that are not word for
  // word the original's. Compared on the stored card, so a reworded back counts.
  // A new version is judged against its live deck, not as a copy of anything.
  const version = deck.draftOfId ? await versionSummary(id) : null;
  const copy = deck.draftOfId ? null : copiedFrom(deck);
  const original = copy && deck.sourceDeckId ? await prisma.word.findMany({ where: { deckId: deck.sourceDeckId }, select: { text: true, details: true } }) : null;
  const same = new Set((original ?? []).map((w) => JSON.stringify([w.text, w.details])));
  const changed = original ? deck.cards.filter((c) => !same.has(JSON.stringify([c.text, c.details]))).length : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/admin/decks" className="text-sm font-medium text-accent hover:underline">← Deck review</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{deck.title}</h1>
          {deck.description ? <p className="mt-1 text-sm text-ink-muted">{deck.description}</p> : null}
          <p className="mt-1 text-xs text-ink-muted">By {deck.owner.publicId ?? "a student"} · {cards.length} cards</p>
          <p className="mt-1 text-xs text-ink-muted">
            {deck.termsAcceptedAt
              ? `Library terms ${deck.termsVersion} ticked on ${deck.termsAcceptedAt.toLocaleDateString("en-IN")} · shown as: ${credit ? `by ${credit}` : "no name"} · ${licenceInfo(deck.licence)?.label ?? "no licence"}`
              : "Submitted before the library terms: no consent or licence recorded."}
          </p>
          {institute ? (
            <p className="mt-1 text-xs text-ink">
              Published as the institute <b>{institute.name}</b>{institute.status === "APPROVED" ? "" : ` (institute ${institute.status.toLowerCase()})`}: the submitter is its admin or a teacher there and ticked that they may publish on its behalf. Its logo shows only if you approved one on the Institutes page.
            </p>
          ) : null}
          {deck.members.length ? (
            <p className="mt-1 text-xs text-ink-muted">
              Editors: {deck.members.map((m) => `${m.user?.publicId ?? "a learner"} (${m.termsAcceptedAt ? "accepted the terms" : "has NOT accepted the terms"})`).join(", ")}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-1">
            {aiCount ? <AiBadge label={`${aiCount} of ${cards.length} cards AI-assisted`} /> : null}
            {deck.tags.map((t) => <Badge key={t}>{t}</Badge>)}
          </div>
        </div>
        <Badge variant={published ? "success" : pending ? "accent" : "neutral"}>
          {published ? "Published" : pending ? "Waiting for review" : deck.status === "REJECTED" ? "Rejected" : "Not submitted"}
        </Badge>
      </div>

      {version ? (
        <Card className="mt-5">
          <h2 className="font-display text-base font-bold text-ink">New version of “{version.liveTitle}”</h2>
          <p className="mt-1 text-sm text-ink">
            {version.added} card{version.added === 1 ? "" : "s"} added · {version.changed} changed · {version.removed} removed, compared with the{" "}
            {version.liveListed ? <Link href={`/library/${version.liveId}`} className="text-accent underline">published deck</Link> : "deck as it was last approved"}.
          </p>
          <p className="mt-1 text-sm text-ink-muted">Approving copies these changes onto the published deck. Followers keep their progress, except on removed cards. Rejecting leaves the published deck as it is.</p>
        </Card>
      ) : null}

      {copy ? (
        <Card className="mt-5">
          <h2 className="font-display text-base font-bold text-ink">This deck is a copy</h2>
          <p className="mt-1 text-sm text-ink">
            Copied from {copy.href ? <Link href={copy.href} className="text-accent underline">{copy.line}</Link> : copy.line}.
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            {changed === null
              ? "The original has been deleted, so the cards cannot be compared."
              : `${changed} of ${cards.length} cards are new or changed compared with the original. Approve a copy only if it adds something and keeps the credit.`}
          </p>
        </Card>
      ) : null}

      {deck.reports.length ? (
        <Card className="mt-5">
          <h2 className="font-display text-base font-bold text-ink">Open reports ({deck.reports.length})</h2>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm text-ink">
            {deck.reports.map((r) => (
              <li key={r.id}><b>{REPORT_REASONS[r.reason]}</b>{r.note ? ` — ${r.note}` : ""}</li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionButton url="/api/admin/decks" body={{ action: "dismiss", id }} label="Dismiss reports" variant="outline" />
            <ActionButton url="/api/admin/decks" body={{ action: "takedown", id }} label="Take the deck down" askReason />
          </div>
        </Card>
      ) : null}

      {pending ? (
        <Card className="mt-5">
          <h2 className="font-display text-base font-bold text-ink">Check against the library rules</h2>
          <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5 text-sm text-ink">
            {LIBRARY_RULES.map((r) => <li key={r.title}><b>{r.title}.</b> <span className="text-ink-muted">{r.detail}</span></li>)}
            {deck.owner.creditStyle === "DISPLAY_NAME" ? <li><b>Display name.</b> <span className="text-ink-muted">“{credit}” is acceptable to show publicly.</span></li> : null}
          </ol>
        </Card>
      ) : null}

      {pending ? (
        <Card className="mt-5 flex flex-wrap items-center gap-3">
          <p className="mr-auto text-sm text-ink-muted">Read every card first. A reason is required to reject, and the owner sees it.</p>
          <ActionButton url="/api/admin/decks" body={{ action: "reject", id }} label="Reject" askReason />
          <ActionButton url="/api/admin/decks" body={{ action: "approve", id }} label="Approve" variant="primary" />
        </Card>
      ) : null}

      <ul className="mt-6 flex flex-col gap-3">
        {cards.map((c) => (
          <li key={c.id}>
            <Card className="flex flex-col gap-3 p-4">
              <CardFront card={c} />
              <hr className="border-border" />
              <CardBack card={c} />
            </Card>
          </li>
        ))}
      </ul>
    </main>
  );
}

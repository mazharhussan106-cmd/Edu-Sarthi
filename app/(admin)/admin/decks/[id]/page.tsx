// Owns one deck's review page for an admin: every card as a learner would see
// it, the open reports, and the decisions — approve or reject (with a reason
// the owner reads), dismiss reports or take the deck down.
//
// It deliberately shows the owner's student ID, not their name or email: the
// decision is about the deck, and the rest of the app keeps names from staff
// the same way.

import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { CARD_SELECT, cardText } from "@/lib/decks";
import { REPORT_REASONS } from "@/lib/deckSchemas";
import { resolveMediaUrl } from "@/lib/storage";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ActionButton } from "@/components/admin/ActionButton";
import { CardBack, CardFront } from "@/components/decks/CardFace";

export const revalidate = 0;

export default async function AdminDeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deck = await prisma.deck.findUnique({
    where: { id },
    select: {
      title: true, description: true, tags: true, visibility: true, status: true, rejectReason: true,
      owner: { select: { publicId: true } },
      cards: { orderBy: { serial: "asc" }, select: CARD_SELECT },
      reports: { where: { resolvedAt: null }, orderBy: { createdAt: "asc" }, select: { id: true, reason: true, note: true } },
    },
  });
  // Admins review what was submitted or reported, not any private deck whose id they hold.
  if (!deck || (deck.visibility !== "PUBLIC" && deck.reports.length === 0)) notFound();

  const cards = await Promise.all(
    deck.cards.map(async (c) => ({
      id: c.id,
      front: c.text,
      ...cardText(c),
      imageSrc: c.imageUrl ? await resolveMediaUrl(c.imageUrl) : null,
      audioSrc: c.audioUrl ? await resolveMediaUrl(c.audioUrl) : null,
    })),
  );
  const pending = deck.visibility === "PUBLIC" && deck.status === "PENDING_REVIEW";
  const published = deck.visibility === "PUBLIC" && deck.status === "APPROVED";

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/admin/decks" className="text-sm font-medium text-accent hover:underline">← Deck review</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{deck.title}</h1>
          {deck.description ? <p className="mt-1 text-sm text-ink-muted">{deck.description}</p> : null}
          <p className="mt-1 text-xs text-ink-muted">By {deck.owner.publicId ?? "a student"} · {cards.length} cards</p>
          <div className="mt-2 flex flex-wrap gap-1">{deck.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div>
        </div>
        <Badge variant={published ? "success" : pending ? "accent" : "neutral"}>
          {published ? "Published" : pending ? "Waiting for review" : deck.status === "REJECTED" ? "Rejected" : "Not submitted"}
        </Badge>
      </div>

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

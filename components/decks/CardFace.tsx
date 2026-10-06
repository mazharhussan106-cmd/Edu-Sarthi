// Owns showing one student-made card's content: text, optional picture,
// optional audio and Markdown notes. Used by the study screen, the editor's
// preview list and the shared-link page, so a card looks the same everywhere.
//
// It deliberately does NOT decide which side is showing (StudyCard) or fetch
// media — signed URLs arrive already resolved from the server page.

import { CardMarkdown } from "@/components/decks/CardMarkdown";

export type FaceCard = {
  front: string;
  back: string;
  example: string;
  body: string;
  imageSrc: string | null;
  audioSrc: string | null;
  /// Our own rebuilt embed address (lib/video), never pasted text.
  videoSrc: string | null;
  /// Teacher's guide. Empty for student cards.
  audit: string;
  /// Every field of an Excel-imported 56-point card, or null for a hand-made one.
  rich: Record<string, string> | null;
};

export function CardFront({ card }: { card: FaceCard }) {
  if (card.rich) {
    // A short summary: the full three-side card is RichCard's job, and listing
    // a few hundred of them on one page would be too heavy for a phone.
    return (
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="font-display text-2xl font-bold text-ink">{card.front}</p>
        {card.rich.cue ? <p className="text-sm text-ink-muted">{card.rich.cue}</p> : null}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="font-display text-2xl font-bold text-ink">{card.front}</p>
      {card.imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed storage URL, not optimisable by next/image
        <img src={card.imageSrc} alt="" className="max-h-56 rounded-lg border border-border object-contain" loading="lazy" />
      ) : null}
      {card.videoSrc ? (
        <iframe
          src={card.videoSrc}
          title="Video for this card"
          loading="lazy"
          allowFullScreen
          // No scripts from other origins beyond what the player needs, and no
          // top-level navigation: a card is content, not a way to leave the site.
          sandbox="allow-scripts allow-same-origin allow-presentation"
          referrerPolicy="strict-origin-when-cross-origin"
          className="aspect-video w-full max-w-md rounded-lg border border-border"
        />
      ) : null}
      {card.audioSrc ? <audio controls preload="none" src={card.audioSrc} className="w-full max-w-sm" aria-label="Listen" /> : null}
    </div>
  );
}

export function CardBack({ card }: { card: FaceCard }) {
  if (card.rich) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-lg font-medium text-ink">{card.back}</p>
        {card.rich.code ? <pre className="overflow-x-auto rounded-lg bg-paper-dim p-3 font-mono text-xs text-ink"><code>{card.rich.code}</code></pre> : null}
        {card.rich.output ? <pre className="overflow-x-auto rounded-lg bg-paper-dim p-3 font-mono text-xs text-ink-muted"><code>{card.rich.output}</code></pre> : null}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-lg font-medium text-ink">{card.back}</p>
      {card.example ? <p className="text-sm italic text-ink-muted">“{card.example}”</p> : null}
      {card.body ? <CardMarkdown source={card.body} /> : null}
      {card.audit ? (
        <div className="rounded-lg border border-border bg-paper-dim p-3">
          <p className="text-xs font-medium text-ink-muted">Teacher’s guide — what to listen for</p>
          <div className="mt-1"><CardMarkdown source={card.audit} /></div>
        </div>
      ) : null}
    </div>
  );
}

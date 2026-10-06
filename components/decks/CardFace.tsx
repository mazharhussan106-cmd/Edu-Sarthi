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
};

export function CardFront({ card }: { card: FaceCard }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="font-display text-2xl font-bold text-ink">{card.front}</p>
      {card.imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed storage URL, not optimisable by next/image
        <img src={card.imageSrc} alt="" className="max-h-56 rounded-lg border border-border object-contain" loading="lazy" />
      ) : null}
      {card.audioSrc ? <audio controls preload="none" src={card.audioSrc} className="w-full max-w-sm" aria-label="Listen" /> : null}
    </div>
  );
}

export function CardBack({ card }: { card: FaceCard }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-lg font-medium text-ink">{card.back}</p>
      {card.example ? <p className="text-sm italic text-ink-muted">“{card.example}”</p> : null}
      {card.body ? <CardMarkdown source={card.body} /> : null}
    </div>
  );
}

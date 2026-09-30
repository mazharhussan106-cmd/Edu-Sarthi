// Owns choosing what is drawn on each side of a card, for each kind of card:
// a word (WordMaster sheet) or a chunk (Chunk Library). The deck hands over
// the side number and the card; this file picks the components.
//
// It deliberately holds no state and no gestures — FlashcardDeck and
// CardSurface own those, identically for both kinds.

"use client";

import type { ReactNode } from "react";

import { CardFront } from "@/components/flashcards/CardFront";
import { CardPractice } from "@/components/flashcards/CardPractice";
import { CardRealLife } from "@/components/flashcards/CardRealLife";
import { CardUsage } from "@/components/flashcards/CardUsage";
import { ChunkBack } from "@/components/flashcards/chunk/ChunkBack";
import { ChunkFront } from "@/components/flashcards/chunk/ChunkFront";
import { ChunkPractice } from "@/components/flashcards/chunk/ChunkPractice";
import { chunkDetailsOf, type ChunkPath } from "@/lib/chunkCard";
import { detailsOf } from "@/lib/wordCard";

export const WORD_TITLES = ["FRONT SIDE · RECOGNITION", "BACK SIDE · UNDERSTANDING & USAGE", "SIDE 3 · REAL LIFE & PRACTICE"] as const;
export const CHUNK_TITLES = ["CHUNK · RECOGNITION", "CHUNK · MEANING & USE", "CHUNK · PRACTICE"] as const;

export type SideCard = {
  code: string;
  text: string;
  details: unknown;
  partOfSpeech: string | null;
  category: string | null;
  cefr: string | null;
  importance: number | null;
  imageUrl: string | null;
  videoUrl: string | null;
};

/// What only a chunk card needs, looked up by the page on the server.
export type ChunkExtras = {
  path: ChunkPath;
  distractors: string[];
  related: { code: string; text: string } | null;
  relatedHref: string | null;
};

type Common = {
  side: 0 | 1 | 2;
  card: SideCard;
  stage: number | null;
  dueLabel: string | null;
  recordHref: string | null;
  onSpeak: () => void;
  backToFront: ReactNode;
};

export function WordSide({ side, card, stage, dueLabel, recordHref, onSpeak, backToFront }: Common) {
  const d = detailsOf(card.details);
  if (side === 0) return <CardFront code={card.code} text={card.text} d={d} imageUrl={card.imageUrl} onSpeak={onSpeak} meta={card} />;
  if (side === 1) return <CardUsage d={d} />;
  return (
    <div className="flex flex-col gap-3">
      <CardRealLife d={d} />
      <CardPractice d={d} stage={stage} dueLabel={dueLabel} videoUrl={card.videoUrl} recordHref={recordHref} />
      {backToFront}
    </div>
  );
}

export function ChunkSide({ side, card, stage, dueLabel, recordHref, onSpeak, backToFront, extras }: Common & { extras: ChunkExtras }) {
  const d = chunkDetailsOf(card.details);
  if (side === 0) {
    return (
      <ChunkFront
        code={card.code}
        text={card.text}
        type={card.category}
        level={card.cefr}
        lewisType={card.partOfSpeech}
        d={d}
        path={extras.path}
        onSpeak={onSpeak}
      />
    );
  }
  if (side === 1) return <ChunkBack text={card.text} d={d} related={extras.related} relatedHref={extras.relatedHref} />;
  return (
    <div className="flex flex-col gap-3">
      <ChunkPractice
        code={card.code}
        text={card.text}
        d={d}
        distractors={extras.distractors}
        stage={stage}
        dueLabel={dueLabel}
        videoUrl={card.videoUrl}
        recordHref={recordHref}
      />
      {backToFront}
    </div>
  );
}

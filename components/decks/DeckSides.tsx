// Owns what is drawn on each side of a deck card, for the two kinds a deck can
// hold: an imported 56-point card (full three-side layout) and a hand-made
// card (front, then back with notes, then a practice side). The study screen
// and the library viewer hand over the side number and the card; this file
// picks the components.
//
// It deliberately holds no state and no gestures — CardSurface owns those,
// identically for every kind of card, as the owner asked for one card design.

"use client";

import { Image as ImageIcon, Volume2 } from "lucide-react";
import type { ReactNode } from "react";

import { Box, Row, Tip } from "@/components/flashcards/chunk/parts";
import { Block, OwnSentence, ReviewPlan } from "@/components/flashcards/PracticeParts";
import { CardMarkdown } from "@/components/decks/CardMarkdown";
import { RichBack } from "@/components/decks/rich/RichBack";
import { RichFront } from "@/components/decks/rich/RichFront";
import { RichPractice } from "@/components/decks/rich/RichPractice";
import { cn } from "@/lib/utils";

export type DeckCardData = {
  id: string;
  code: string;
  front: string;
  back: string;
  example: string;
  body: string;
  audit: string;
  rich: Record<string, string> | null;
  imageSrc: string | null;
  audioSrc: string | null;
  videoSrc: string | null;
};

type Props = {
  side: 0 | 1 | 2;
  card: DeckCardData;
  stage: number | null;
  dueLabel: string | null;
  onSpeak: () => void;
  backToFront: ReactNode;
};

function size(t: string): string {
  return t.length <= 18 ? "text-[1.9em]" : t.length <= 40 ? "text-[1.4em]" : "text-[1.15em]";
}

export function DeckSide({ side, card, stage, dueLabel, onSpeak, backToFront }: Props) {
  if (card.rich) {
    if (side === 0) return <RichFront code={card.code} f={card.rich} onSpeak={onSpeak} />;
    if (side === 1) return <RichBack f={card.rich} />;
    return <RichPractice code={card.code} f={card.rich} stage={stage} dueLabel={dueLabel} backToFront={backToFront} />;
  }

  if (side === 0) {
    return (
      <div className="flex flex-col gap-[0.6em]">
        <div className="flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-[0.7em] border border-dashed border-border-strong bg-paper-dim">
          {card.imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed storage URL
            <img src={card.imageSrc} alt={`Picture for ${card.front}`} className="h-full w-full object-contain" />
          ) : (
            <span className="flex flex-col items-center gap-[0.2em] text-ink-muted">
              <ImageIcon className="h-[2em] w-[2em]" aria-hidden="true" />
              <span className="text-[0.6em]">No picture</span>
            </span>
          )}
        </div>
        <p className={cn("font-display font-extrabold leading-tight text-tag-navy", size(card.front))}>{card.front}</p>
        {card.audioSrc ? (
          <audio controls preload="none" src={card.audioSrc} aria-label={`Listen: ${card.front}`} className="h-[2.4em] w-full" />
        ) : (
          <button type="button" onClick={onSpeak} aria-label={`Listen to ${card.front}`} className="inline-flex w-fit items-center gap-[0.5em] rounded-full border border-border-strong px-[0.7em] py-[0.25em] text-[0.8em] text-ink hover:bg-hover">
            <Volume2 className="h-[1em] w-[1em] text-tag-blue" aria-hidden="true" /> Listen
          </button>
        )}
        <p className="text-center text-[0.62em] text-ink-muted">tap = turn over · swipe = next card · pinch = zoom</p>
      </div>
    );
  }

  if (side === 1) {
    return (
      <div className="flex flex-col gap-[0.4em]">
        <Box
          tone="blue"
          items={[
            { tone: "blue", label: "Meaning", body: <p className="whitespace-pre-line">{card.back}</p> },
            { tone: "navy", label: "Example", body: card.example ? <p className="italic">“{card.example}”</p> : null },
          ]}
        />
        {card.body ? <Tip tone="teal" title="Notes"><CardMarkdown source={card.body} /></Tip> : null}
        {card.audit ? <Tip tone="navy" title="Teacher’s guide — what to listen for"><CardMarkdown source={card.audit} /></Tip> : null}
        {card.videoSrc ? (
          <iframe
            src={card.videoSrc}
            title={`Video for ${card.front}`}
            loading="lazy"
            allowFullScreen
            // A card is content, not a way to leave the site: no top-level navigation.
            sandbox="allow-scripts allow-same-origin allow-presentation"
            referrerPolicy="strict-origin-when-cross-origin"
            className="aspect-video w-full rounded-[0.5em] border border-border"
          />
        ) : null}
        <div className="flex items-end justify-between">
          <p className="text-[0.62em] text-ink-muted">tap = turn over · pinch = zoom</p>
          <span className="rounded-tl-[0.8em] bg-saffron/25 px-[0.6em] py-[0.25em] font-display text-[0.7em] font-extrabold text-tag-saffron">PTO ↻</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <dl><Row icon={Volume2} tone="blue" label="Say it" value="Say the card out loud, then write it in your own sentence." /></dl>
      <Block n={1} title="Use It In Your Own Sentence" tone="text-tag-teal">
        <p>{card.front}</p>
        <OwnSentence id={`${card.code}-own`} />
      </Block>
      <ReviewPlan stage={stage} dueLabel={dueLabel} />
      {backToFront}
    </div>
  );
}

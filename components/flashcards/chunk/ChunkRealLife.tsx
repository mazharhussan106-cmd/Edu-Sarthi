// Owns the "Examples in real life" part of side 3 on a chunk or grammar
// card: the everyday, work and casual lines and the mini conversation, in the
// same boxes as the word card's CardRealLife.
//
// It deliberately holds no practice; ChunkPractice follows it on the same
// side. Plain server-safe markup, no state.

import type { ReactNode } from "react";

import type { ChunkDetails } from "@/lib/chunkCard";
import { cn } from "@/lib/utils";

function Item({ title, tone, children }: { title: string; tone: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border px-3 py-2">
      <p className={cn("font-display text-[0.8em] font-bold", tone)}>{title}</p>
      <div className="mt-0.5 text-ink">{children}</div>
    </div>
  );
}

export function ChunkRealLife({ d }: { d: ChunkDetails }) {
  const r = d.real_life;
  const real = [
    { title: "🏠 Everyday", tone: "text-tag-blue", text: r?.everyday },
    { title: "💼 At work", tone: "text-tag-saffron", text: r?.work },
    { title: "💬 Casual", tone: "text-tag-green", text: r?.casual },
  ].filter((x) => x.text);
  const talk = d.conversation ?? [];

  if (!real.length && !talk.length) return null;

  return (
    <section aria-labelledby="chunk-real-life" className="flex flex-col gap-2">
      <h3 id="chunk-real-life" className="font-display text-[0.75em] font-extrabold tracking-widest text-tag-navy">
        EXAMPLES IN REAL LIFE
      </h3>
      {real.map((x) => (
        <Item key={x.title} title={x.title} tone={x.tone}>
          {x.text}
        </Item>
      ))}
      {talk.length ? (
        <Item title="🗣 Mini Conversation" tone="text-tag-teal">
          {talk.map((l, i) => <p key={i}>{l}</p>)}
        </Item>
      ) : null}
    </section>
  );
}

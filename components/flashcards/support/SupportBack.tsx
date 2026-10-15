// Owns side 2 of a customer-support card, "Meaning & Use", in the chunk
// card's style (bordered boxes, coloured headings), with the boxes of the
// approved mockup: the Hindi meaning and plain meaning, the tone, the common
// mistake with the line not to say and its positive swap, what to ask next
// and the replies to expect, and the grammar in one line.
//
// Everything else (why it works, pushback, other ways to say it, the mini
// conversation, the notes) sits on side 3 (SupportRealLife), which scrolls:
// side 2 must fit one screen, and more boxes would shrink it unreadably.
// All sizes are `em` so CardSurface can fit it.

import { Box } from "@/components/flashcards/chunk/parts";
import { dotList, watchOut, type SupportDetails } from "@/lib/supportCard";

export function SupportBack({ d }: { d: SupportDetails }) {
  const w = watchOut(d.watch_out);
  const replies = dotList(d.replies_you_may_hear);
  const grammar = [d.key_chunk, d.grammar_pattern].filter(Boolean);

  return (
    <div className="flex flex-col gap-[0.4em]">
      <Box
        tone="saffron"
        items={[
          {
            tone: "saffron",
            label: "हिंदी मतलब · Hindi meaning",
            body: d.hindi_meaning ? (
              <>
                <p>{d.hindi_meaning}</p>
                {d.hindi_roman ? <p className="text-ink-muted">{d.hindi_roman}</p> : null}
              </>
            ) : null,
          },
          { tone: "blue", label: "In simple English", body: d.simple_meaning },
        ]}
      />

      <Box tone="green" items={[{ tone: "green", label: "☺ Tone", body: d.tone_note }]} />

      <Box
        tone="red"
        items={[
          {
            tone: "red",
            label: "⚠ Watch out",
            body: w ? (
              <>
                <p><span className="font-bold text-error">✗</span> {w.wrong}</p>
                <p><span className="font-bold text-success">✓</span> {w.right}</p>
              </>
            ) : d.watch_out,
          },
          { tone: "red", label: "Don’t say", body: d.dont_say },
          { tone: "green", label: "Positive swap", body: d.positive_swap },
        ]}
      />

      <Box
        tone="blue"
        items={[
          { tone: "blue", label: "❓ Ask next", body: d.ask_next ? `“${d.ask_next}”` : null },
          { tone: "saffron", label: "👂 Replies you may hear", body: replies.length ? replies.map((r) => `“${r}”`).join(" · ") : null },
        ]}
      />

      <Box
        tone="navy"
        items={[
          {
            tone: "navy",
            label: "✎ Grammar in one line",
            body: grammar.length || d.grammar_note ? (
              <>
                {grammar.length ? <p className="font-semibold">{grammar.join(" · ")}</p> : null}
                {d.grammar_note ? <p>{d.grammar_note}</p> : null}
              </>
            ) : null,
          },
        ]}
      />

      <div className="flex items-end justify-between gap-[0.6em]">
        <p className="text-[0.62em] text-ink-muted">Draft, not yet checked by a teacher. tap = turn over · pinch = zoom</p>
        {/* "Please turn over", as on the other cards: a third side follows. */}
        <span className="shrink-0 rounded-tl-[0.8em] bg-saffron/25 px-[0.6em] py-[0.25em] font-display text-[0.7em] font-extrabold text-tag-saffron">
          PTO ↻
        </span>
      </div>
    </div>
  );
}

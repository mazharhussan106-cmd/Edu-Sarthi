// Owns side 2 of a chunk or grammar card, "Understanding & Usage", in the
// word card's style (CardUsage): bordered boxes, coloured headings.
//
// Same layout rule as the word card: fields that hold sentences (meaning,
// examples, the common mistake, pattern, forms, the confusing pair) get the
// full width; short lists (similar / don't say, reply / related, where /
// tone) share a box two to a row.
//
// Fields Claude drafted are named in the footer as not yet checked by a
// teacher, so a student knows how far to trust them. All sizes are `em` so
// CardSurface can fit the side.

import Link from "next/link";

import { Box } from "@/components/flashcards/chunk/parts";
import type { Bilingual, ChunkDetails } from "@/lib/chunkCard";

function Hindi({ h }: { h: Bilingual }) {
  return (
    <>
      {h.dev ? <p>{h.dev}</p> : null}
      {h.roman ? <p className="text-ink-muted">{h.roman}</p> : null}
    </>
  );
}

export function ChunkBack({
  text,
  d,
  related,
  relatedHref,
}: {
  text: string;
  d: ChunkDetails;
  related: { code: string; text: string } | null;
  relatedHref: string | null;
}) {
  const w = d.watch_out;
  const examples = [d.example, ...(d.more_examples ?? [])].filter(Boolean) as string[];
  const tone = [d.register && `Register: ${d.register}`, d.tone && `Tone: ${d.tone}`].filter(Boolean) as string[];
  const drafts = d.drafted ?? [];
  const draftNote = drafts.length ? "Draft, not yet checked by a teacher. " : "";

  return (
    <div className="flex flex-col gap-[0.4em]">
      <Box
        tone="blue"
        items={[
          { tone: "blue", label: "Meaning (Simple)", body: d.simple },
          { tone: "saffron", label: "Hindi Meaning", body: d.hindi ? <Hindi h={d.hindi} /> : null },
          {
            tone: "navy",
            label: "Example Sentences",
            body: examples.length ? (
              <ul className="list-disc pl-[1.1em]">
                {examples.map((e) => <li key={e}>{e}</li>)}
              </ul>
            ) : null,
          },
          { tone: "saffron", label: "Hindi Example", body: d.hindi_example ? <Hindi h={d.hindi_example} /> : null },
        ]}
      />

      <Box
        tone="saffron"
        items={[
          {
            tone: "saffron",
            label: "Common Mistake",
            body: w?.wrong ? (
              <>
                <p><span className="font-bold text-error">✗</span> {w.wrong}</p>
                <p><span className="font-bold text-success">✓</span> {w.right ?? text}</p>
                {w.why ? <p className="text-ink-muted">{w.why}</p> : null}
              </>
            ) : w?.tip,
          },
          { tone: "blue", label: "Grammar Pattern", body: d.pattern },
          { tone: "green", label: "Other Forms", body: d.forms },
        ]}
      />

      <Box
        tone="green"
        cols={2}
        items={[
          { tone: "green", label: "Similar Chunks", body: d.similar },
          { tone: "red", label: "Don’t Say", body: d.dont_say },
        ]}
      />

      <Box
        tone="navy"
        cols={2}
        items={[
          { tone: "navy", label: "Reply You’ll Hear", body: d.reply },
          {
            tone: "teal",
            label: "Related Chunk",
            body:
              related && relatedHref ? (
                <Link href={relatedHref} className="font-medium text-accent underline underline-offset-2">
                  {related.text}
                </Link>
              ) : null,
          },
        ]}
      />

      <Box
        tone="amber"
        items={[
          {
            tone: "saffron",
            label: "Confusing Chunks",
            body: d.confusing?.pair ? (
              <>
                <p className="font-semibold">{d.confusing.pair}</p>
                {d.confusing.diff ? <p>{d.confusing.diff}</p> : null}
              </>
            ) : null,
          },
          { tone: "amber", label: "Note", body: d.note },
        ]}
      />

      <Box
        tone="blue"
        cols={2}
        items={[
          { tone: "green", label: "Where It’s Used", body: d.where?.length ? d.where.join(" · ") : null },
          { tone: "blue", label: "Register & Tone", body: tone.length ? tone.map((t) => <p key={t}>{t}</p>) : null },
        ]}
      />

      {d.merged_from ? <p className="text-[0.62em] text-ink-muted">Also covers {d.merged_from.replace(/^Frames:\s*/, "the frame ")}</p> : null}

      <div className="flex items-end justify-between gap-[0.6em]">
        <p className="text-[0.62em] text-ink-muted">{draftNote}tap = turn over · pinch = zoom</p>
        {/* "Please turn over", as on the word card: a third side follows. */}
        <span className="shrink-0 rounded-tl-[0.8em] bg-saffron/25 px-[0.6em] py-[0.25em] font-display text-[0.7em] font-extrabold text-tag-saffron">
          PTO ↻
        </span>
      </div>
    </div>
  );
}

// Owns side 2 of a chunk card, "Understanding": the Hindi meaning (Devanagari
// with Roman underneath), the example in English and Hindi, the common
// mistake to avoid, the sheet's note, and a related chunk.
//
// Hindi that Claude drafted (all Devanagari, and the Core 220 gaps) is
// labelled as a draft on the card, so a student knows a teacher has not
// checked it yet. Sizes are `em` so CardSurface can fit the side.

import Link from "next/link";
import type { ReactNode } from "react";

import type { Bilingual, ChunkDetails } from "@/lib/chunkCard";
import { cn } from "@/lib/utils";

function Box({ edge, title, tone, children }: { edge: string; title: string; tone: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-[0.6em] border-[1.3px] px-[0.7em] py-[0.45em]", edge)}>
      <p className={cn("text-[0.72em] font-bold", tone)}>{title}</p>
      <div className="text-[0.85em] leading-snug text-ink">{children}</div>
    </div>
  );
}

function Hindi({ h, big = false }: { h: Bilingual; big?: boolean }) {
  return (
    <>
      {h.dev ? <p className={cn(big && "text-[1.15em] font-medium")}>{h.dev}</p> : null}
      {h.roman ? <p className="text-[0.9em] text-ink-muted">{h.roman}</p> : null}
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
  const drafts = d.drafted ?? [];
  const draftNote = [
    drafts.some((f) => f.startsWith("hindi")) && "Hindi script",
    drafts.includes("example") && "the example",
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-[0.5em]">
      {d.hindi ? (
        <Box edge="border-tag-saffron/35" title="हिंदी मतलब · Hindi meaning" tone="text-tag-saffron">
          <Hindi h={d.hindi} big />
        </Box>
      ) : null}

      {d.example || d.hindi_example ? (
        <Box edge="border-tag-blue/35" title="Example" tone="text-tag-blue">
          {d.example ? <p className="font-medium">{d.example}</p> : null}
          {d.hindi_example ? (
            <div className="mt-[0.3em] border-t border-dashed border-border pt-[0.3em]">
              <Hindi h={d.hindi_example} />
            </div>
          ) : null}
        </Box>
      ) : null}

      {w?.wrong || w?.tip ? (
        <Box edge="border-tag-red/35" title="⚠ Watch out" tone="text-tag-red">
          {w.wrong ? (
            <>
              <p><span className="font-bold text-error">✗</span> {w.wrong}</p>
              <p><span className="font-bold text-success">✓</span> {text}</p>
              {w.why ? <p className="text-ink-muted">{w.why}</p> : null}
            </>
          ) : (
            <p>{w.tip}</p>
          )}
        </Box>
      ) : null}

      {d.note ? (
        <Box edge="border-tag-teal/35" title="Note" tone="text-tag-teal">
          <p>{d.note}</p>
        </Box>
      ) : null}

      {related && relatedHref ? (
        <Box edge="border-tag-navy/35" title="Related chunk" tone="text-tag-navy">
          <Link href={relatedHref} className="font-medium text-accent underline underline-offset-2">
            {related.text}
          </Link>
        </Box>
      ) : null}

      {d.merged_from ? <p className="text-[0.68em] text-ink-muted">Also covers {d.merged_from.replace(/^Frames:\s*/, "the frame ")}</p> : null}

      <div className="flex items-end justify-between gap-[0.6em]">
        <p className="text-[0.62em] text-ink-muted">
          {draftNote.length ? `Draft, not yet checked by a teacher: ${draftNote.join(" and ")}. ` : ""}tap = turn over
        </p>
        <span className="shrink-0 rounded-tl-[0.8em] bg-saffron/25 px-[0.6em] py-[0.25em] font-display text-[0.7em] font-extrabold text-tag-saffron">
          PTO ↻
        </span>
      </div>
    </div>
  );
}

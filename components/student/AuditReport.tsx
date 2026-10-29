// Owns the finished-audit view (spec S-11), laid out per docs/AUDIT-PAGE-PLAN.md:
// the result first (overall score, band, change, the teacher's opening line),
// then "Fix these first" with Try again, the player with every note, the
// skills, progress, the teacher's full words, and Try again once more.
//
// Phone: one column in that order. Computer (lg): the report on the left and
// the player with all notes in a sticky column on the right, so a time pressed
// anywhere plays in a player that never leaves the screen. The DOM keeps the
// phone order, so a screen reader reads the report first on both.
//
// It deliberately stays a server component. Only AuditSeek needs the browser.
// It does not query: the page hands it everything.

import Link from "next/link";
import type { MediaKind } from "@prisma/client";

import { Card, CardTitle } from "@/components/ui/Card";
import { AuditPlayer, AuditSeekProvider, SeekNotes } from "@/components/student/AuditSeek";
import { AuditSkills } from "@/components/student/AuditSkills";
import { AuditProgress } from "@/components/student/AuditProgress";
import {
  allowanceLine,
  bandFor,
  focusAndStrength,
  openingLine,
  overallOf,
  skillRows,
  TOP_FIXES,
  topFixes,
  type SkillScores,
} from "@/lib/auditReport";
import type { NoteInput } from "@/lib/validations";

function TryAgain({ href, allowance }: { href: string; allowance: { perDay: number; left: number } }) {
  return (
    <div>
      <Link
        href={href}
        className="flex h-12 items-center justify-center rounded-lg bg-accent text-sm font-medium text-on-accent hover:bg-accent-dark"
      >
        Try this again
      </Link>
      {/* Said here, before the tap: a student at the limit should not find
          out from the practice page's gate after choosing to try again. */}
      <p className="mt-2 text-center text-xs text-ink-muted">{allowanceLine(allowance)}</p>
    </div>
  );
}

export function AuditReport({
  retryHref,
  prompt,
  mediaUrl,
  mediaKind,
  notes,
  feedback,
  previous,
  history,
  best,
  allowance,
  autoPlay,
  playbackRate,
}: {
  retryHref: string;
  prompt: string;
  mediaUrl: string | null;
  mediaKind: MediaKind;
  notes: readonly NoteInput[];
  feedback: SkillScores & { summary: string };
  previous: SkillScores | null;
  /// Overall scores, oldest first, ending with this audit; and its number.
  history: { number: number; scores: readonly number[] };
  best: "best" | "equal" | null;
  allowance: { perDay: number; left: number };
  autoPlay: boolean;
  playbackRate: number;
}) {
  const overall = overallOf(feedback);
  const delta = previous ? overall - overallOf(previous) : null;
  const opening = openingLine(feedback.summary);
  const playable = Boolean(mediaUrl) && mediaKind !== "IMAGE";
  // With three notes or fewer the top card already holds them all; a second
  // list below would only repeat it.
  const fixes = notes.length > TOP_FIXES ? topFixes(notes) : [...notes];
  const allNotesBelow = notes.length > TOP_FIXES;

  return (
    <AuditSeekProvider>
      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-6">
        <div className="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
          <Card className="p-4 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
              <div>
                <p className="text-xs uppercase tracking-wider text-ink-muted">Overall</p>
                <p className="font-mono text-3xl font-bold text-ink">
                  {overall.toFixed(1)}
                  <span className="text-base font-normal text-ink-muted">/10</span>
                  <span className="ml-2 font-sans text-base font-medium text-ink">· {bandFor(overall)}</span>
                </p>
              </div>
              {delta !== null ? (
                <p className={delta >= 0 ? "text-sm font-medium text-success" : "text-sm font-medium text-error"}>
                  <span aria-hidden="true">{delta >= 0 ? "▲ +" : "▼ −"}</span>
                  <span className="sr-only">{delta >= 0 ? "Up " : "Down "}</span>
                  {Math.abs(delta).toFixed(1)} since your last audit
                </p>
              ) : (
                <p className="text-sm text-ink-muted">Your first audit</p>
              )}
            </div>
            {best ? (
              <p className="mt-2 text-sm font-medium text-success">
                <span aria-hidden="true">★ </span>
                {best === "best" ? "Your best score so far" : "Equals your best score so far"}
              </p>
            ) : null}
            <blockquote className="mt-4 border-l-2 border-accent pl-3 text-sm text-ink">
              {opening.line}
            </blockquote>
            <p className="mt-1 pl-3 text-xs text-ink-muted">
              Your teacher
              {!opening.whole ? (
                <>
                  {" · "}
                  <a href="#teacher-note" className="text-accent-dark hover:underline">
                    Read all they said
                  </a>
                </>
              ) : null}
            </p>
          </Card>

          {fixes.length > 0 ? (
            <Card className="p-4 sm:p-6">
              <CardTitle>{allNotesBelow ? "Fix these first" : "Where to improve"}</CardTitle>
              <p className="mt-1 text-xs text-ink-muted">
                {allNotesBelow
                  ? `The ${TOP_FIXES} that matter most, out of ${notes.length} notes.`
                  : "Your teacher's notes."}
                {playable ? " Press a time to hear that moment again." : ""}
              </p>
              <div className="mt-3">
                <SeekNotes notes={fixes} playable={playable} />
              </div>
            </Card>
          ) : null}

          <TryAgain href={retryHref} allowance={allowance} />
        </div>

        {/* Right column on a computer; between "Try again" and the skills on a phone. */}
        <aside
          aria-label="Your recording and notes"
          className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-h-[calc(100dvh-6rem)]"
        >
          {playable ? (
            <AuditPlayer src={mediaUrl!} kind={mediaKind} autoPlay={autoPlay} playbackRate={playbackRate} />
          ) : (
            <Card className="p-4 sm:p-6">
              <CardTitle>Your submission</CardTitle>
              <div className="mt-3">
                {/* A missing file is not fatal here, unlike on the teacher's page:
                    the audit is what the student came for. */}
                {!mediaUrl ? (
                  <p className="text-sm text-ink-muted">
                    This recording is no longer available to play. Your audit is unaffected.
                  </p>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl}
                    alt="Your written work"
                    className="max-h-[32rem] w-full rounded-lg border border-border object-contain"
                  />
                )}
              </div>
            </Card>
          )}

          {allNotesBelow ? (
            <Card className="p-4 sm:p-6 lg:min-h-0 lg:overflow-y-auto">
              <CardTitle>All {notes.length} notes</CardTitle>
              <p className="mt-1 text-xs text-ink-muted">In the order you said them.</p>
              <div className="mt-3">
                <SeekNotes notes={[...notes].sort((a, b) => a.at - b.at)} playable={playable} />
              </div>
            </Card>
          ) : null}
        </aside>

        <div className="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-2">
          <AuditSkills rows={skillRows(feedback, previous)} focus={focusAndStrength(feedback)} />
          <AuditProgress number={history.number} scores={history.scores} />

          {!opening.whole ? (
            <Card id="teacher-note" className="scroll-mt-20 p-4 sm:p-6">
              <CardTitle>What your teacher said</CardTitle>
              {/* whitespace-pre-line so the teacher's paragraph breaks survive. */}
              <p className="mt-2 whitespace-pre-line text-sm text-ink-muted">{feedback.summary}</p>
            </Card>
          ) : null}

          <details className="rounded-xl border border-border bg-surface p-4 sm:px-6">
            <summary className="cursor-pointer text-sm font-medium text-ink">What you were asked</summary>
            <p className="mt-2 whitespace-pre-line text-sm text-ink-muted">{prompt}</p>
          </details>

          <TryAgain href={retryHref} allowance={allowance} />
        </div>
      </div>
    </AuditSeekProvider>
  );
}

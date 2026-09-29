// Owns the screen a student sees when a teacher sent their attempt back
// instead of auditing it (spec S-12): the reason, tips matched to it, the
// original recording, and a way to record a replacement right here.
//
// It deliberately re-records on this screen rather than sending the student
// to the practice page. The reason and the tips are what make the second
// attempt better, and they should stay in view while recording.

import Link from "next/link";
import type { MediaKind, ReturnReason } from "@prisma/client";

import { Card, CardTitle } from "@/components/ui/Card";
import { Player } from "@/components/media/Player";
import { SubmitPanel } from "@/components/media/SubmitPanel";
import { RETURN_REASON_LABEL, RETURN_TIPS } from "@/lib/audits";

export function SendBackView({
  submissionId,
  exercise,
  reason,
  note,
  mediaUrl,
  mediaKind,
  replacementId,
  maxBytes,
  wordId = null,
}: {
  submissionId: string;
  exercise: { id: string; expects: MediaKind; maxSeconds: number | null };
  reason: ReturnReason | null;
  note: string | null;
  mediaUrl: string | null;
  mediaKind: MediaKind;
  replacementId: string | null;
  maxBytes: number;
  /// Kept on the replacement, so a re-recorded flashcard stays tied to its word.
  wordId?: string | null;
}) {
  return (
    <>
      <div role="status" className="mt-5 rounded-xl bg-error/12 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-error">
          Sent back by your teacher
        </p>
        <p className="mt-1 font-display text-base font-bold text-ink">
          {reason ? RETURN_REASON_LABEL[reason] : "This attempt needs to be recorded again"}
        </p>
        {note ? <p className="mt-1 text-sm text-ink-muted">“{note}”</p> : null}
      </div>

      {replacementId ? (
        <Card className="mt-4">
          <CardTitle>Already replaced</CardTitle>
          <p className="mt-2 text-sm text-ink-muted">
            You sent a new recording for this one. Its audit will appear there.
          </p>
          <Link
            href={`/feedback/${replacementId}`}
            className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
          >
            Open the new attempt
          </Link>
        </Card>
      ) : (
        <>
          {reason ? (
            <Card className="mt-4">
              <CardTitle>Before you record again</CardTitle>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
                {RETURN_TIPS[reason].map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </Card>
          ) : null}

          {mediaUrl && mediaKind !== "IMAGE" ? (
            <Card className="mt-4">
              <CardTitle>Your first recording</CardTitle>
              <Player src={mediaUrl} kind={mediaKind === "VIDEO" ? "VIDEO" : "AUDIO"} className="mt-3" />
            </Card>
          ) : null}

          <Card className="mt-4">
            <CardTitle>Record it again</CardTitle>
            <p className="mt-1 text-xs text-ink-muted">
              The new recording goes straight back to the teacher queue.
            </p>
            <div className="mt-4">
              <SubmitPanel
                exerciseId={exercise.id}
                expects={exercise.expects}
                maxSeconds={exercise.maxSeconds}
                maxBytes={maxBytes}
                retryOfId={submissionId}
                wordId={wordId ?? undefined}
                submitLabel="Submit replacement"
              />
            </div>
          </Card>
        </>
      )}
    </>
  );
}

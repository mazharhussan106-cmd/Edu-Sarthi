// Owns "Generate AI draft" on the audit page: it transcribes the recording,
// measures the speech, asks Claude for a draft audit and returns it to the
// teacher's form. Nothing is sent to the student and no Feedback is written
// here; the teacher edits the draft and submits through /api/feedback as ever.
//
// Only the teacher who holds the claim may ask, for the same reason only that
// teacher can submit the audit: an AI draft is work on their submission. It
// deliberately handles audio only; video and photos have no transcript to
// build a draft from.
//
// The one thing saved is the transcript, on Submission.transcript. The draft is
// not stored, so a closed tab means asking again, and that counts toward the
// limits in lib/aiLimits.ts.

import { NextResponse } from "next/server";

import { AiError, MAX_AUDIO_BYTES, speechStats, transcribeAudio } from "@/lib/aiTranscribe";
import { draftAudit } from "@/lib/aiDraft";
import { AI_OFF_MESSAGE, auditDraftEnabled } from "@/lib/aiEnabled";
import { reserveDraft } from "@/lib/aiLimits";
import { requireUser } from "@/lib/apiUser";
import { readMediaBytes } from "@/lib/mediaBytes";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Transcribing a few minutes of audio and then drafting takes 15-40 seconds.
export const maxDuration = 60;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireUser();
  if (!gate.ok) return gate.res;
  if (gate.role !== "TEACHER" && gate.role !== "ADMIN") {
    return NextResponse.json({ error: "You do not have access to this." }, { status: 403 });
  }
  const { id } = await params;

  // Scoped by claimedById in the WHERE clause, not fetched and compared.
  const submission = await prisma.submission.findFirst({
    where: { id, claimedById: gate.id, status: "IN_REVIEW" },
    select: {
      mediaUrl: true,
      mediaKind: true,
      exercise: { select: { title: true, prompt: true, module: { select: { level: true } } } },
      word: { select: { text: true } },
    },
  });
  if (!submission) {
    return NextResponse.json(
      { error: "This submission is no longer yours to review. Go back to the queue." },
      { status: 409 },
    );
  }
  if (submission.mediaKind !== "AUDIO" || !submission.mediaUrl) {
    return NextResponse.json(
      { error: "The AI draft works on audio recordings only. Write this audit by hand." },
      { status: 422 },
    );
  }

  // Before the draft is counted: without the keys nothing can be made, and a
  // click that fails must not use up the teacher's drafts.
  if (!auditDraftEnabled()) return NextResponse.json({ error: AI_OFF_MESSAGE }, { status: 503 });

  const reserved = await reserveDraft(gate.id, id);
  if (!reserved.ok) return NextResponse.json({ error: reserved.error }, { status: 429 });

  try {
    const media = await readMediaBytes(submission.mediaUrl, MAX_AUDIO_BYTES);
    if (!media) {
      return NextResponse.json(
        { error: "The recording could not be opened, so there is nothing to draft from. Try again, or release this submission." },
        { status: 422 },
      );
    }

    const transcript = await transcribeAudio(media);

    // Saved before the draft is asked for: if Claude fails, the teacher keeps
    // the transcript. Scoped to this teacher's claim like every write here.
    await prisma.submission.updateMany({
      where: { id, claimedById: gate.id },
      data: { transcript: transcript.text },
    });

    const stats = speechStats(transcript);
    const draft = await draftAudit({
      taskTitle: submission.word ? `Say and use "${submission.word.text}"` : submission.exercise.title,
      taskPrompt: submission.exercise.prompt,
      level: `course module ${submission.exercise.module.level}`,
      transcript,
      stats,
    });

    return NextResponse.json({ ok: true, draft, transcript: transcript.text, stats });
  } catch (err) {
    if (err instanceof AiError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    // Not logged with the error object: it can carry request details.
    console.error("ai-draft failed:", err instanceof Error ? err.name : "unknown");
    return NextResponse.json(
      { error: "Something went wrong making the draft. Try again, or write this audit by hand." },
      { status: 500 },
    );
  }
}

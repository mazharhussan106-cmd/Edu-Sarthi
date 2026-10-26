// Owns the teacher form's two pieces of logic that are not about the screen:
// merging an AI draft into what the teacher already has, and sending the
// finished audit to the server.
//
// Pure functions and one fetch, no React state, so the rules can be tested
// without rendering the form. It deliberately decides nothing about WHEN to
// do either; RubricForm owns that.

import type { CriterionKey, Scores } from "@/components/review/ScorePanel";
import type { AiDraft } from "@/lib/aiDraft";
import type { NoteInput } from "@/lib/validations";

/// Moves a slider only if the teacher has not set it. It stays "not set" (the
/// caller leaves `touched` alone): the teacher must still confirm each score
/// after listening, which is what stops an unheard audit being sent.
export function mergeAiScores(scores: Scores, touched: ReadonlySet<CriterionKey>, d: AiDraft): Scores {
  const next = { ...scores };
  for (const k of ["grammar", "vocabulary", "fluency"] as const) {
    if (!touched.has(k)) next[k] = d[k].score;
  }
  return next;
}

/// The teacher's own summary is never replaced.
export function mergeAiSummary(current: string, d: AiDraft): string {
  return current.trim() ? current : d.summary;
}

/// Adds the AI's notes without repeating one already there, in time order.
export function mergeAiNotes(current: NoteInput[], d: AiDraft): NoteInput[] {
  const have = new Set(current.map((n) => `${n.at}|${n.note}`));
  return [...current, ...d.notes.filter((n) => !have.has(`${n.at}|${n.note}`))].sort((a, b) => a.at - b.at);
}

/// Sends the audit. The response is read as text first: a serverless timeout
/// returns an HTML page, and a bare res.json() on that would throw.
export async function postAudit(payload: object): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const raw = await res.text();
    let data: { error?: string } = {};
    try {
      data = JSON.parse(raw);
    } catch {
      data = { error: "Something went wrong. Your audit is saved here — try again." };
    }
    return res.ok ? { ok: true } : { ok: false, error: data.error ?? "Could not save the audit. It is saved here — try again." };
  } catch {
    return { ok: false, error: "Could not reach the server. Your audit is saved here — try again." };
  }
}

// Local-only autosave for the teacher's in-progress rubric form. Keyed by
// submission id so each review has its own slot and nothing crosses over
// between two submissions open in different tabs.
//
// Deliberately does NOT persist the in-progress "add note" form fields (the
// draft text, draftAt, severity) — only notes the teacher has actually
// committed. Losing an unfinished note on an accidental tab close is a minor
// annoyance; losing five already-written notes because a tab crashed is not.
//
// No expiry or cleanup job: an orphaned draft is harmless. RubricForm already
// refuses to render for a submission this teacher no longer has claimed, so a
// stale draft simply never gets read again.

const PREFIX = "edusarthi:draft:";

export type AuditDraft = {
  pronunciation: number;
  grammar: number;
  fluency: number;
  vocabulary: number;
  confidence: number;
  notes: Array<{ at: number; note: string; severity: "minor" | "major" }>;
  summary: string;
};

function key(submissionId: string): string {
  return `${PREFIX}${submissionId}`;
}

export function readDraft(submissionId: string): AuditDraft | null {
  try {
    const raw = localStorage.getItem(key(submissionId));
    if (!raw) return null;
    return JSON.parse(raw) as AuditDraft;
  } catch {
    return null;
  }
}

export function saveDraft(submissionId: string, draft: AuditDraft): void {
  try {
    localStorage.setItem(key(submissionId), JSON.stringify(draft));
  } catch {
    // Storage full or unavailable (private browsing). Autosave is a
    // convenience, not a guarantee — fail silently rather than block typing.
  }
}

export function clearDraft(submissionId: string): void {
  try {
    localStorage.removeItem(key(submissionId));
  } catch {}
}

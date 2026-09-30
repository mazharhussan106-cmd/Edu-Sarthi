// Owns how a submission's state is described to a student: the badge text,
// its colour, and which filter tab it belongs to. Every student screen that
// shows a status reads from here, so "Sent back" is never "Returned" on one
// page and "Try again" on another.
//
// It deliberately does NOT query. It maps values the caller already has.

import type { ReturnReason, SubmissionStatus } from "@prisma/client";

export type BadgeVariant = "accent" | "neutral" | "success" | "error";

export const STATUS_BADGE: Record<SubmissionStatus, { text: string; variant: BadgeVariant }> = {
  PENDING: { text: "Pending", variant: "neutral" },
  IN_REVIEW: { text: "In review", variant: "accent" },
  REVIEWED: { text: "Completed", variant: "success" },
  RETURNED: { text: "Sent back", variant: "error" },
};

export const AUDIT_FILTERS = [
  { value: "all", label: "All" },
  { value: "review", label: "In review" },
  { value: "action", label: "Action needed" },
  { value: "done", label: "Completed" },
] as const;

export type AuditFilter = (typeof AUDIT_FILTERS)[number]["value"];

export function parseFilter(raw: string | string[] | undefined): AuditFilter {
  return AUDIT_FILTERS.some((f) => f.value === raw) ? (raw as AuditFilter) : "all";
}

export function statusesFor(filter: AuditFilter): SubmissionStatus[] {
  switch (filter) {
    case "review":
      return ["PENDING", "IN_REVIEW"];
    case "action":
      return ["RETURNED"];
    case "done":
      return ["REVIEWED"];
    default:
      return ["PENDING", "IN_REVIEW", "REVIEWED", "RETURNED"];
  }
}

export const RETURN_REASON_LABEL: Record<ReturnReason, string> = {
  BACKGROUND_NOISE: "Background noise too high",
  INAUDIBLE: "Audio could not be heard",
  WRONG_PROMPT: "Different prompt was read",
  INCOMPLETE: "Recording is incomplete",
};

/// Tips shown on the re-record screen, matched to the teacher's reason.
export const RETURN_TIPS: Record<ReturnReason, string[]> = {
  BACKGROUND_NOISE: [
    "Switch off the fan, TV or music for the two minutes you record.",
    "A small room with curtains or a cupboard of clothes absorbs echo.",
    "Hold the phone about one hand's length from your mouth.",
  ],
  INAUDIBLE: [
    "Speak towards the bottom of the phone, where the microphone is.",
    "Play back your recording before sending — if you strain to hear it, so will the teacher.",
    "Check nothing is covering the microphone, like a phone case or your thumb.",
  ],
  WRONG_PROMPT: [
    "Read the task again at the top of this screen before you record.",
    "Answer the exact question asked; the audit is scored against it.",
  ],
  INCOMPLETE: [
    "Wait a second after pressing Record before you start speaking.",
    "Finish your last sentence, then press Stop.",
    "Aim for the time shown in the task.",
  ],
};

export function averageScore(f: {
  pronunciation: number;
  grammar: number;
  fluency: number;
  vocabulary: number;
  confidence: number;
}): number {
  return (f.pronunciation + f.grammar + f.fluency + f.vocabulary + f.confidence) / 5;
}

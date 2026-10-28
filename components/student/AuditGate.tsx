// Owns the line above a "send for audit" panel saying how many recordings are
// left today, and, at the daily limit, a card in place of the panel.
//
// It sits before the recorder on purpose: a student over the limit should
// learn it before recording and uploading, not from an error afterwards.
// The routes enforce the limit anyway (lib/auditLimit). It deliberately does
// NOT wrap the re-record panel for a sent-back recording; that never counts.

import Link from "next/link";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/Card";
import { AUDITS_PER_DAY, auditsLeftToday } from "@/lib/auditLimit";

export async function AuditGate({ studentId, children }: { studentId: string; children: ReactNode }) {
  const left = await auditsLeftToday(studentId);

  if (left === 0) {
    return (
      <Card>
        <p className="font-display font-bold text-ink">Today’s recordings for audit are sent</p>
        <p className="mt-1 text-sm text-ink-muted">
          You can send {AUDITS_PER_DAY} a day, so teachers can audit everyone’s on time. Send the next one tomorrow; the
          count starts again at midnight India time. Practise this one aloud today anyway.
        </p>
        <Link href="/feedback" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
          See My Audits
        </Link>
      </Card>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs text-ink-muted">
        You can send {AUDITS_PER_DAY} recordings a day for audit. <b className="text-ink">{left} left today.</b>
      </p>
      {children}
    </div>
  );
}

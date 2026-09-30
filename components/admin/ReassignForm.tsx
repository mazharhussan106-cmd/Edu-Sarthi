// Owns the "reassign to teacher" control on the dispatch table: a teacher
// picker and a button. Separate from ActionButton because the body depends on
// the picker's value.

"use client";

import { useState } from "react";

import { ActionButton } from "@/components/admin/ActionButton";

export function ReassignForm({
  submissionId,
  teachers,
  current,
}: {
  submissionId: string;
  teachers: readonly { id: string; label: string }[];
  current: string | null;
}) {
  const [teacherId, setTeacherId] = useState(current ?? "");
  return (
    <span className="inline-flex items-center gap-1.5">
      <select
        aria-label="Teacher"
        value={teacherId}
        onChange={(e) => setTeacherId(e.target.value)}
        className="h-8 max-w-40 rounded-md border border-border-strong bg-surface px-1.5 text-xs text-ink"
      >
        <option value="">Teacher…</option>
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
      {teacherId && teacherId !== current ? (
        <ActionButton
          url="/api/admin/dispatch"
          body={{ action: "reassign", submissionId, teacherId }}
          label="Assign"
          busyLabel="Assigning…"
        />
      ) : null}
    </span>
  );
}

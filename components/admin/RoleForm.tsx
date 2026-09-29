// Owns the role picker on the users table. Changing the select only stages
// the change; it is sent, with a reason, through ActionButton.

"use client";

import { useState } from "react";
import type { Role } from "@prisma/client";

import { ActionButton } from "@/components/admin/ActionButton";

export function RoleForm({ userId, role }: { userId: string; role: Role }) {
  const [next, setNext] = useState<Role>(role);
  return (
    <span className="inline-flex items-start gap-1.5">
      <select
        aria-label="Role"
        value={next}
        onChange={(e) => setNext(e.target.value as Role)}
        className="h-8 rounded-md border border-border-strong bg-surface px-1.5 text-xs text-ink"
      >
        <option value="STUDENT">Student</option>
        <option value="TEACHER">Teacher</option>
        <option value="ADMIN">Admin</option>
      </select>
      {next !== role ? (
        <ActionButton
          url="/api/admin/users"
          body={{ action: "role", userId, role: next }}
          label="Save role"
          askReason
        />
      ) : null}
    </span>
  );
}

# What this backup is

This zip is the Phase 1–9 build as it stood after the 26 Aug pre-deploy audit
(see `00-INDEX.md`) — 80 files, `next build` confirmed clean at the time.
`edusarthi-project-context.md` is the fuller handoff doc written later, and is
more current on status/decisions than `00-INDEX.md`.

Two files are newer than the 26 Aug snapshot and are included with their real,
final content: `lib/draftStorage.ts` and `lib/textSize.ts`.

## Not in this zip

Built after 26 Aug, in chat, and pasted onto your laptop directly (this
session's own sandbox does not persist between chats, so I don't hold a copy
of the exact final bytes — only a description of each change):

- Enrollment: `app/api/enrollments/route.ts`, `components/student/EnrollButton.tsx`,
  and edits to both `modules` pages + the dashboard
- Header stats actually wired: `components/layout/StudentStats.tsx`,
  `components/layout/TeacherStats.tsx`, and edits to all three layouts
- The 3 settings toggles actually working (not just saved): edits to
  `app/globals.css`, `app/layout.tsx`, `app/api/profile/preferences/route.ts`,
  `app/(shared)/settings/SettingsForm.tsx`
- Draft autosave wired into `components/review/RubricForm.tsx` (the storage
  helper itself, `lib/draftStorage.ts`, *is* in this zip)
- Audit-ready email: edits to `lib/email.ts` and `app/api/feedback/route.ts`
- `prisma/schema.prisma`: the `Enrollment` model

**If you want a backup that actually has all of this** — zip your real project
folder on your laptop and send it over; that copy has everything, since you
pasted each file in yourself as we built it. This zip is a safe fallback, not
a replacement for that.

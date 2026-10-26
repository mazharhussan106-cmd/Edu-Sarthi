# History (practice + study) — plan and status

Branch: `claude/zen-noether-2av4n9`. Built 26 Oct 2026. Owner asked for: both kinds of history, visible to student, teacher and admin, used by the dashboard, with a new menu item under Profile.

## What exists

| Piece | Where |
|---|---|
| Table `ReviewLog` (append-only: user, card, known, recall, stage, time) | `prisma/schema.prisma` |
| One row written on every card "mark", after the CardState upsert, outside any transaction, errors swallowed | `app/api/flashcards/route.ts` |
| All queries and the access rule | `lib/history.ts` |
| Student page `/history` (Practice and Study tabs, `?cursor=` paging, delete-my-study-history) | `app/(student)/history/page.tsx`, `app/api/history/study/route.ts`, `components/history/*` |
| Menu "You → History", Profile card (students only) | `lib/studentNav.ts`, `app/(shared)/profile/page.tsx` |
| Dashboard "Recent activity" card | `components/dashboard/RecentHistory.tsx` |
| Teacher/admin page `/students/[publicId]/history`, "Full history" link on the dossier, "History" link on admin Users rows | `app/(teacher)/students/[publicId]/history/page.tsx` |

## Decisions (do not undo)

- **Practice history is not a new table.** It reads `Submission` + `Feedback`. Only study history needed `ReviewLog`, because `CardState` overwrites the previous answer.
- **History starts the day `ReviewLog` went live.** Earlier answers were already overwritten. The pages say so; do not backfill from `CardState` (it would invent one answer per card).
- **Who may see what** (`canViewHistory`): a student sees only their own; an admin sees any, and every first page opened is written to `AdminLog` as "Viewed student history"; a teacher sees only students whose submission they claimed, were assigned, or audited. A refused teacher gets the same 404 as a missing student. Owner accepted these defaults on 26 Oct.
- **Teachers/admins never read the text of a card from a student's private deck** (`deckId` or `ownerId` set); the row says "A card from a private deck".
- **Teachers keep the existing rule for recordings:** ones assigned to another teacher's deck are hidden.
- **Guests:** study history works for them; their Practice tab explains that recordings need an account.
- **Teachers/admins opening `/history`** are redirected home — their view of a student is the page above.
- **No recording links on the teacher page,** so opening a finished one cannot look like claiming it.
- **Deleting study history** removes only `ReviewLog` rows. `CardState` (review dates, streak source) is untouched.
- Dashboard card catches a missing `ReviewLog` table so a deploy before Database setup cannot take the dashboard down. `/history` itself has no such guard.

## To go live

1. Merge into `main`.
2. Run **Actions → Database setup** once. It adds the `ReviewLog` table (new table; nothing existing is touched).

## Not done / undecided

- **12-month cleanup of `ReviewLog`** (agreed default, not built). It needs a cron beside `lib/retention.ts`. Until then rows are kept until the student deletes them or the account is deleted (`onDelete: Cascade` handles the account).
- The DPDP data export (`app/api/me/route.ts`) includes no card data at all — neither `CardState` nor `ReviewLog`. Decide whether it should before the export is described as complete.
- The student sees one page of 20 at a time with Older/Newest links; no date filter or search.
- Nothing was run against the real Supabase database or opened in a browser. Verified: `tsc` and `next build` (after step 4), and the `lib/history.ts` queries against a throwaway local Postgres (paging, access rule, private-card text withheld). The pages themselves were not rendered.
- `dashboard/page.tsx` is 243 lines; split it before adding anything else.

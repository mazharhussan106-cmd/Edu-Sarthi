# EduSarthi — project memory (shared by every chat)

Every Claude chat starts empty. This file is the one place that says where the project stands, so a new chat does not rebuild what exists or contradict a decision. **Update it before a chat ends, then push.** Last updated 6 Oct 2026 (audit fixes). Note: `middleware.ts` is now `proxy.ts` (Next 16); CLAUDE.md's word "middleware" refers to it.

## What EduSarthi is

An English spoken-communication training platform: students record or upload, teachers return a rubric-scored audit; plus a flashcard system (words, chunks, grammar, and now student/teacher/institute decks). Next.js 16 · Prisma · Supabase · Vercel. Rules: `CLAUDE.md`. The long original context (27 Aug, partly out of date): `edusarthi-project-context.md`.

## What each chat did (from the git history and the chats' own status lines)

| Branch / chat | What it built | State |
|---|---|---|
| `festive-thompson` — "GitHub push" | WordMaster 2000: 2,227 words with 56 fields each, Excel files and tools in `content/wordmaster-2000/` | In `main` |
| `ecstatic-mccarthy` — "App image plan overview" | **Chunk (1,183) and Grammar (247) cards on the same 3-side card** (`docs/CHUNK-PLAN.md`), word and chunk data audits, and — from its own status line — the flashcard-maker test decks (Physics 8, 1857 Revolt 9, Photosynthesis 5 cards: built, checked, awaiting a push decision). Its PR #1 is in `main` (git history there shows the word-card redesign, themes, card colours, the "Database setup" button and the live-testing guide; some of that may come from earlier chats) | The Chunk/Grammar commits were **not** in `main` until they were merged into `happy-galileo` on 6 Oct |
| `trusting-noether` — "Live phone testing setup" | Bulk-loading words so the database setup finishes in time (PR #2); its chat title is live phone testing. Last question it asked the owner: **Vercel or Hostinger for hosting? (unanswered)** | In `main` (PR #2) |
| `happy-galileo` — "Open source flashcard repository" | The deck library: student decks, share link, public library with admin review, reports, likes, teacher decks (video, teacher's guide, verification), institutes, Excel import of 56-point decks. Plan and status: `docs/flashcard-library-plan.md` | **Not in `main` yet.** Contains the Chunk/Grammar work too after the 6 Oct merge |

## Decisions that must not be undone

- **One card.** Words, chunks, grammar and every deck card use the EduSarthi card in `components/flashcards/`: navy header band, three sides that turn, text that fits the screen, Known / Unknown / Remark bar, Day 1·3·7·15·30·60 review. Mockups: `docs/flashcard-v2-cards.png`, `docs/flashcard-built.png`, `docs/chunk-cards.png`. Plan for chunks (the pattern to copy): `docs/CHUNK-PLAN.md`.
- Built-in cards have `deckId = null`. Anything that picks "the next built-in card", counts built-in cards, or opens a card by code must filter on that, or student-made and imported deck cards leak into everyone's daily session.
- Card code from an uploaded Excel file is only ever **shown**, never run by the server.
- Public decks are reviewed by an admin first; institute decks stay inside the institute; imported 56-point cards are read-only in the app (edit the sheet, upload again, same ID updates).
- Words and chunk data were audited for repeated examples and "label instead of mistake" cells (`docs/CHUNK-PLAN.md`, `content/wordmaster-2000/tools/word_fixes.py`). Do not undo.

## Open work, most important first

1. **Done (6 Oct):** imported 56-point cards and hand-made deck cards now use the EduSarthi card (`components/decks/rich/*`, `DeckStudy`). Do not add another card look.
1b. **Audit done (6 Oct):** see `docs/AUDIT-2026-10.md` — what was fixed, and the deferred list (session end on password reset, register throttle, CSRF/CSP, upload quotas, DPDP consent, repo clutter for the owner to decide). Next ideas for revenue: `docs/ROADMAP-EARNING.md`.
2. Merge the branches into `main` (a pull request from `happy-galileo`), then run **Actions → Database setup** so the new tables, indexes and the nullable `Institute.applicantId` exist on the live database.
3. Hosting choice (Vercel or Hostinger) — see `LIVE-TESTING-GUIDE.md` and `DEPLOY.md`.
4. Owner's backlog after a live test: orphan-upload cleanup, in-app notifications, licence and credit for public decks, institute recordings.
5. Nothing from the deck library, the Excel import or institutes has been opened against the real Supabase bucket, SendGrid or YouTube yet.

## Student settings, phase A (10 Oct, branch `claude/laughing-goodall-cxctvz`)

Done: header search (`components/layout/HeaderSearch.tsx`); card side 2 bigger type, 3-part last row with the PTO box; Settings: text size A−/A/A+ (replaced the unused "Larger text"), new cards per day (5–30), hide Hindi meanings, say-word-on-open, data saver for recordings, audit-ready email (the toggle existed before but nothing sent the email), opt-in daily reminder email (cron `/api/cron/reminders`, fixed ~7 pm IST), sign out of all devices.

How it works: preferences live in the `User.preferences` JSON (`lib/preferences.ts`). Settings that must be known before first paint (text size, Hindi, data saver) are also cookies stamped on `<html>` as `data-text`, `data-hindi`, `data-saver` by `app/layout.tsx`; the cookie is per device and is only set when the setting is changed on that device. Sign-out-everywhere uses the new nullable `User.sessionsValidFrom` and a `loginAt` claim in the JWT.

**Needs before it works live:** merge, then run Actions → Database setup (adds `sessionsValidFrom`; no data is touched). Set `CRON_SECRET`, `SENDGRID_API_KEY`, `NEXT_PUBLIC_APP_URL` for the emails and cron.

Not done / undecided: Hindi/English/Hinglish UI language; a per-student reminder time (needs an hourly cron); revoking sessions on password reset; "Hide Hindi" does not hide the Hindi-to-English practice question or Hindi in deck cards imported from Excel; nothing here was type-checked or run (no `node_modules` in the cloud session) — run `npm run build` first. 

**Phases B, C, D done (10 Oct):** menu with more links + Install app, `/help`, `/progress`, richer dashboard (`lib/studentStats.ts`, `components/dashboard/*`), profile level/goal/badges (badges are computed in `lib/badges.ts`, nothing stored). Audit: `tsc` and `next build` pass (run with dummy env); an independent review found sign-out-everywhere missing on routes that call `auth()` directly — fixed via `isRevoked()` in `lib/activeUser.ts` (requireAdmin, feedback, /api/me); the cron now pages through students with one grouped count. Known gaps: `/api/auth/verify` and `/api/profile/theme` still skip the revocation check; preference cookies are per device and are not cleared on sign-out (shared computers); `dashboard/page.tsx` is over 250 lines; no upcoming-class/notices (no data source), no profile photo, no ESLint config in the repo.

## Starting a new chat

Say: **"Read CLAUDE.md and docs/PROJECT-MEMORY.md first."** Before it finishes, ask it to add what changed and what is undecided to this file and push. Chats on different branches only see each other's work after it is merged into `main`.

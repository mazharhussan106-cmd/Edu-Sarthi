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
- **Flashcards are always written in English.** Every flashcard deck made by any chat or by the flashcard-maker skill (explanations, memory stories, analogies, mini conversations, practice questions) is written in plain English, not Hinglish. Commands and code stay as they are. Owner's instruction, 6 Oct 2026; supersedes the skill's default of Hinglish for Hindi speakers.
- Built-in cards have `deckId = null`. Anything that picks "the next built-in card", counts built-in cards, or opens a card by code must filter on that, or student-made and imported deck cards leak into everyone's daily session.
- Card code from an uploaded Excel file is only ever **shown**, never run by the server.
- Learners see the Teacher's guide on the back of a teacher's card; only the editor field is staff-only. Recordings on deck cards need at least 15 seconds. Both confirmed by the owner on 27 Oct 2026, so do not "fix" either.
- Public decks are reviewed by an admin first; institute decks stay inside the institute; imported 56-point cards are read-only in the app (edit the sheet, upload again, same ID updates).
- Words and chunk data were audited for repeated examples and "label instead of mistake" cells (`docs/CHUNK-PLAN.md`, `content/wordmaster-2000/tools/word_fixes.py`). Do not undo.

## Open work, most important first

1. **Done (6 Oct):** imported 56-point cards and hand-made deck cards now use the EduSarthi card (`components/decks/rich/*`, `DeckStudy`). Do not add another card look.
1b. **Audit done (6 Oct):** see `docs/AUDIT-2026-10.md` — what was fixed, and the deferred list (session end on password reset, register throttle, CSRF/CSP, upload quotas, DPDP consent, repo clutter for the owner to decide). Next ideas for revenue: `docs/ROADMAP-EARNING.md`.
2. Merge the branches into `main` (a pull request from `happy-galileo`), then run **Actions → Database setup** so the new tables, indexes and the nullable `Institute.applicantId` exist on the live database.
3. **Hosting decided (27 Oct): Vercel.** Nothing has been tested live yet — see `LIVE-TESTING-GUIDE.md` and `DEPLOY.md`.
3b. **Vercel "Functions Storage" over the Hobby cap (27 Oct, branch `claude/funny-noether-n7jiof`).** The account showed 10.49 GB / 10 GB; every other meter was far below its limit. The meter is the server-function code Vercel keeps for every stored deployment. The cap covers the whole account, so TypeSarthi counts too, and every push to any `claude/*` branch makes a preview deployment. Cause found: file tracing copied Prisma's WebAssembly engines for five databases (~53 MB) into every function. `next.config.ts` now excludes them (`outputFileTracingExcludes`). Measured: 80.2 MB → 24.7 MB per function. Tested with a standalone build on a local Postgres: Prisma reads, writes and deletes worked with no missing-file errors. **Cleanup done (27 Oct):** edu-sarthi had 84 deployments (67 preview, 17 production, 10–27 Oct); typingsarthi has 3. The owner deleted 82 with `vercel remove <dpl_ids>` from their laptop. Two remain: `dpl_AzNSEQ…` (PR #19, serves `edu-sarthi-nine.vercel.app`) and `dpl_9LYx…` (PR #18; Hobby can roll back only to the previous production). Never run `vercel remove <project-name>`: it deletes the whole project. The Vercel connector can list deployments but has no delete tool. **Decided (27 Oct, owner): preview deployments are off.** Set on the Vercel project (`previewDeploymentsDisabled: true`), not in `vercel.json`, so it covers every branch at once, including old ones that never merge `main`. Only pushes to `main` deploy now: test on the live site after merging; branch preview links no longer exist. To turn previews back on, flip that project setting (the Vercel connector's `update_project` can do it). **Still open:** watch whether the meter drops (forum reports say it can lag or stay stuck; if so, ask Vercel support to recalculate); merge this branch so new deployments are small; one preview from this branch (`dpl_bvWTou…`) was made just before previews were turned off, and can be removed with `vercel remove dpl_bvWTou1pJwNkJFu4rvuGWivDHDSa --scope mazhar-cowork`; a paid feature launch will need the Pro plan anyway (Hobby is for non-commercial use).
4. Owner's backlog after a live test: orphan-upload cleanup, in-app notifications, licence and credit for public decks (now decided, see 4b), institute recordings.
4b. **Flashcard library v2 planned (27 Oct, branch `claude/sweet-davinci-d313f6`): `docs/LIBRARY-V2-PLAN.md`.** Owner's decisions:
   - small fixes to a published deck go live without waiting for review;
   - learners follow the original deck (copying stays an option);
   - public decks show the creator's name (the student chooses what is shown), with "Copied from …" on copies;
   - CC BY-SA 4.0, and EduSarthi will use public decks in paid features;
   - only the admin reviews, and every deck is reviewed;
   - view-only and edit sharing;
   - no public publishing for under-18s.

   Second round of answers (also 27 Oct):
   - institutes may publish to the library under their name and logo;
   - small fix = one fix per card per day, at most 10 cards a day, at most 30 characters per field;
   - big edits keep the approved version live;
   - under-18s may share by link and edit private decks shared with them;
   - followers lose a deck its author withdraws;
   - creators get a revenue share, free AI cards and badges;
   - edit sharing only by named invite.

   Phase 1 is built (see 4d); nothing later is.
4c. **Phase 0 started (27 Oct).**
   - Actions → Database setup was run on the live database (run #7, success). It had not run since PR #17, so the AI columns were missing on the live database.
   - The full round (student deck, teacher deck with recording and audit, institute, report, Explore) passed on a local copy.
   - The owner's phone checklist is `docs/PHASE0-LIVE-TEST.md`. **Next: the owner runs it on the live site**, then Phase 1.
   - The test raised two questions. The owner answered both: learners keep seeing the Teacher's guide, and card recordings keep the 15-second minimum.
4d. **Library v2 Phase 1 built and merged (27 Oct, PR #18).**
   - What it does: submitting a deck now opens a form with a one-time "I am 18 or older" tick, how the creator's name shows (full name, first name, display name or no name), and three required ticks (own work, CC BY-SA 4.0, EduSarthi may use it in paid features).
   - What is saved: on the account, `adultConfirmedAt`, `creditStyle` and `publicName`; on the deck, `licence`, `termsVersion` and `termsAcceptedAt`.
   - Where it shows: "by <name> · licence" in the library, on Explore and on public share pages. Settings → "How your name shows on public decks". Admin review gets a checklist built from the same rules list (`LIBRARY_RULES` in `lib/libraryTerms.ts`), and Admin → Users can clear a bad display name. New pages: `/legal/library-rules` and the Terms section "Decks you publish to the library".
   - Decks approved before the terms show no licence, and no name until their owner chooses one (a name choice applies to all of a person's public decks).
   - Full details, provisional defaults and the steps after merging: `docs/LIBRARY-V2-PLAN.md` → Phase 1.
4e. **Library v2 Phase 2 built and merged (27 Oct, PR #18).**
   - **Follow and study:** `DeckFollow` table, `lib/deckFollow.ts`, `/library/[id]/study`. Learners study the original deck with their own `CardState`, up to 50 follows. Answers go through `/api/flashcards`, and `canStudyWord` allows a followed deck only while it is listed.
   - **Copied from:** `Deck.sourceDeckId`, `sourceCredit` and `sourceLicence`; copying lives in `lib/deckCopy.ts`. The line is built fresh while the original exists and falls back to the saved credit once it is deleted (`copiedFrom` in `lib/libraryTerms.ts`).
   - **Rules:** a copy of an EduSarthi deck can't be published or link-shared. Withdrawing or taking down a deck deletes its follows. Admin review of a copy shows how many cards changed.
   - The old gap (an edit hid the deck from followers until it was re-approved) is closed by Phase 3 (4f).
4f. **Library v2 Phase 3 built and merged (27 Oct, PR #18). Design: `docs/PHASE3-DESIGN.md`.**
   - **Small fixes:** on a published deck, Edit is a small fix (`lib/smallFix.ts`): text only, at most 30 characters per field (edit distance), each card once per IST day, at most 10 cards a day. A fix goes live at once and is logged in `DeckChange`; the admin uses **Admin → Decks → Fixes to check** to Accept or Undo, and Undo emails the creator and shows a note on their deck.
   - **New versions:** bigger edits go in a new version (`lib/deckVersion.ts`), a working copy with `Deck.draftOfId`, whose cards carry `Word.liveWordId`. It shares files with the live deck (`unusedKeys` guards deletion). Approving merges it onto the same live cards, so followers keep their progress; removed cards lose it. Small fixes pause while a version exists.
   - `sendBackIfPublished` is retired.
   - **Don't undo:** "one version per deck" is enforced in code, not by a unique constraint, because the constraint would trip Database setup's data-loss check.
4g. **Library v2 Phase 4 built and merged (27 Oct, PR #18): share a deck with named people, to view or edit.**
   - **Data:** the `DeckMember` table (invite by email, works before the person has an account, never reveals whether one exists) and `Word.updatedAt` (the "someone changed this card" check).
   - **Access** lives in `lib/deckAccess.ts`, the member actions in `lib/deckMembers.ts`. Screens: People on the deck (owner), Invitations at the top of My decks, Shared with me, and `/decks/[id]/shared` for viewers.
   - **Don't undo:** cards an editor adds belong to the deck's owner.
   - **Rules:** an editor of a public deck must accept the library terms (18+), and the owner can't submit until every editor has. Limits: 10 people per deck, 20 invites a day (each sends an email). New versions stay owner-only to start and submit.
   - Details: `docs/LIBRARY-V2-PLAN.md` → Phase 4.
4h. **Phases 1–4 merged into `main` (27 Oct, PR #18).** Actions → Database setup ran straight after (run #8: "in sync", no data-loss warning, no card changed).
   Still to do, in this order:
   1. ~~Actions → **Load flashcard decks**~~ — done 27 Oct (run 4: 21 decks, licence set, no card changed).
   2. Check that `SENDGRID_API_KEY` and `NEXT_PUBLIC_APP_URL` are set in Vercel (invite and fix-undone emails).
   3. The owner's phone test, `docs/PHASE0-LIVE-TEST.md`. Its "Before you start" step 1 is now done; the submit step has the new consent form.
   4. ~~Phase 5~~ — built, see 4i.
   5. ~~Phase 6~~ — built, see 4j; a lawyer still has to review.
4i. **Library v2 Phase 5 built (27 Oct) on `claude/sweet-davinci-d313f6`, NOT merged yet: institutes publish to the library under their name and logo.** Decisions 18–21 in `docs/LIBRARY-V2-PLAN.md`.
   - **Who and how:** the institute's admin and teachers choose "Publish as <Institute>" in the submit form and tick "I may publish this on behalf of <Institute>". A deck shared inside the institute can be submitted, but only as the institute. Licence: always CC BY-SA.
   - **Data:** a deck published as an institute is a `PUBLIC` deck with `instituteId` set. New columns `Institute.logoKey`, `pendingLogoKey`, `logoNote` (additive). **After merging, run Actions → Database setup.**
   - **Logo:** PNG/JPG/WebP up to 1 MB, uploaded on the Institute page (`lib/instituteLogo.ts`, `components/institute/LogoForm.tsx`), approved or refused under Admin → Institutes → Logos to check. Nothing shows until approved.
   - **Credit:** "[logo] by <Institute> (<person>)" through `components/decks/DeckCredit.tsx` (now an async server component, so never import it into a client component).
   - **Don't undo:** `LISTED` (`lib/decks.ts`) also hides decks of a suspended institute; library pages and the copy route now use `LISTED` instead of repeating the check. `drop()` in `lib/institutes.ts` keeps a leaving teacher's institute-published decks public under their own name. Withdraw and takedown clear `instituteId`.
   - The institute's admin can take the institute's name off any deck (Institute page → Published by the institute).
   - Decisions 22–23 (built): leaving a *suspended* institute sends the person's approved institute decks back to review; the owner is emailed when the institute's admin removes the institute's name.
   - `lib/decks.ts` is now 260 lines (was already over 250); split it when it is next changed.
4j. **Library v2 Phase 6 built (27 Oct) on the same branch, in PR #19, NOT merged yet.** Decisions 24–28.
   - **Legal:** no lawyer yet. `docs/LEGAL-REVIEW-PACK.md` is the assistant's review and the lawyer's reading list. The Privacy and Terms pages were corrected to match Phases 1–5. **Open and important:** parental consent for under-18s (DPDP Act) and naming the legal operator — both need the owner and a lawyer.
   - **Announcements:** Admin → Announcements emails every account holder with a verified email, at most 80 a day from the daily reminders cron, and posts a dashboard notice for 30 days. Tables `Announcement`, `AnnouncementDelivery`. The approved Terms-update email is pre-filled.
   - **After merging:** Database setup; check `SENDGRID_API_KEY`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET` in Vercel; send yourself a test, then Start (type SEND).
5. Nothing from the deck library, the Excel import or institutes has been opened against the real Supabase bucket, SendGrid or YouTube yet.

## Student settings, phase A (10 Oct, branch `claude/laughing-goodall-cxctvz`)

Done: header search (`components/layout/HeaderSearch.tsx`); card side 2 bigger type, 3-part last row with the PTO box; Settings: text size A−/A/A+ (replaced the unused "Larger text"), new cards per day (5–30), hide Hindi meanings, say-word-on-open, data saver for recordings, audit-ready email (the toggle existed before but nothing sent the email), opt-in daily reminder email (cron `/api/cron/reminders`, fixed ~7 pm IST), sign out of all devices.

How it works: preferences live in the `User.preferences` JSON (`lib/preferences.ts`). Settings that must be known before first paint (text size, Hindi, data saver) are also cookies stamped on `<html>` as `data-text`, `data-hindi`, `data-saver` by `app/layout.tsx`; the cookie is per device and is only set when the setting is changed on that device. Sign-out-everywhere uses the new nullable `User.sessionsValidFrom` and a `loginAt` claim in the JWT.

**Needs before it works live:** merge, then run Actions → Database setup (adds `sessionsValidFrom`; no data is touched). Set `CRON_SECRET`, `SENDGRID_API_KEY`, `NEXT_PUBLIC_APP_URL` for the emails and cron.

Not done / undecided: Hindi/English/Hinglish UI language; a per-student reminder time (needs an hourly cron); revoking sessions on password reset; "Hide Hindi" does not hide the Hindi-to-English practice question or Hindi in deck cards imported from Excel; nothing here was type-checked or run (no `node_modules` in the cloud session) — run `npm run build` first. 

**Phases B, C, D done (10 Oct):** menu with more links + Install app, `/help`, `/progress`, richer dashboard (`lib/studentStats.ts`, `components/dashboard/*`), profile level/goal/badges (badges are computed in `lib/badges.ts`, nothing stored). Audit: `tsc` and `next build` pass (run with dummy env); an independent review found sign-out-everywhere missing on routes that call `auth()` directly — fixed via `isRevoked()` in `lib/activeUser.ts` (requireAdmin, feedback, /api/me); the cron now pages through students with one grouped count. Known gaps: `/api/auth/verify` and `/api/profile/theme` still skip the revocation check; preference cookies are per device and are not cleared on sign-out (shared computers); `dashboard/page.tsx` is over 250 lines; no upcoming-class/notices (no data source), no profile photo, no ESLint config in the repo.

## Follow-up batch (10 Oct, PR #6)

Done: revocation check on `/api/auth/verify` and `/api/profile/theme`; password reset ends other sessions; display cookies re-synced from the account on each page (`PrefSync`); quiet auto-speak; dashboard split into components (`lib/dashboardNext.ts`, `components/dashboard/*`); **Notices** — new `Notice` table (additive), admin page `/admin/notices`, card on the student dashboard (this also covers "upcoming class / deadline": an admin posts it with a date).

Run Actions → Database setup after merging: it now also creates the `Notice` table (new table, nothing existing is touched).

Still not done, by choice: per-student reminder time (needs an hourly cron), Hindi/English UI language (undecided), profile photo, phone/email edit, ESLint config, hiding Hindi inside Excel-imported deck cards and the Hindi→English practice question.

## Share + Explore (10 Oct)

Settings (page and the header gear) now has **Share EduSarthi** (phone share sheet, WhatsApp, copy link; no referral tracking). New student page **/explore** (menu → Study, and a chip on the Flashcard tab): built-in counts (Words / Chunks / Grammar and chunk types), approved library decks grouped by subject (= deck tag) with one-tap **Import and study** (copies the deck, opens its study page) and a Teacher-audit badge. Audit only works on decks made by a verified teacher (existing rule: recording goes to that deck's teacher); copies are private and cannot be sent for audit. No database change.

## Flashcard phone layout: lesson (10 Oct)

The card must sit in a box of **definite height** (`h-[calc(100dvh-7.25rem-…)]` on the page, `absolute inset-0` inside the flex-1 wrapper). A `min-h` or auto height lets the box grow to its content, so `useFitFont` always sees "it fits", never shrinks the text and never scrolls. Verified with a local Postgres + Playwright at 448×900: card fills the screen, Known bar ends 6px above the bottom nav, side 2 scrolls inside the card. Side 2's smallest font is 12px.

## Subject decks on Explore (11 Oct, branch claude/gifted-brown-tzvr5h)

The 21 non-English decks in `content/fde-flashcards/` (924 cards: Microsoft Excel, Linux, Docker, Kubernetes, CI/CD, Cloud, Networking, Logging, SSO, JS/TS, API Integration, GitHub, Supabase, Power BI, ETL, Airflow, Jupyter, LLM APIs, RAG, AI Evaluation, Requirements) are loaded by **`prisma/import-decks.ts`**. It reuses the Admin → Import code, so each deck is owned by the admin, public and approved, and shows on **/explore** under six subjects (tags): data, programming, cloud and networking, infrastructure, artificial intelligence, career skills. Re-running updates in place.

**To make them live:** merge, then run **Actions → "Load flashcard decks"** (`.github/workflows/flashcard-decks.yml`). An admin account must already exist; set the repository variable `ADMIN_EMAIL` to choose which one (otherwise the oldest admin). Verified on a local Postgres: 20 decks, 884 cards, idempotent; Explore lists them and "Import and study" opens the Docker deck on the standard card.

**First live run failed (11 Oct):** `P2024 Timed out fetching a new connection` — `importDeck` sent 20 upserts at once, but the live pool has `connection_limit=1`, so they queued past the 10 s pool timeout. Fixed by upserting one card at a time (same fix covers Admin → Import). Re-run the workflow; it is safe to repeat.

**Second live run (11 Oct):** loaded 14 of 21 decks, then hit the 15-minute job limit — one upsert per card took about 1.2 s over the pooler. `importDeck` now inserts new cards with `createMany` (100 per statement) and rewrites only cards whose content changed; the job limit is 45 minutes. Re-running loads the remaining 7 decks and leaves the 14 untouched.

Not included: the Python and SQL decks (their workbooks are not in the repo — upload them in Admin → Import with a tag such as `programming` or `data`). The Excel deck (40 cards, first made on `claude/happy-galileo-167f8x`) now lives in `content/fde-flashcards/xl/`, audited and listed under data. Its XL-023 answer `#DIV/0!` was saved by Excel as an error value and the importer read it as empty; `lib/xlsxCards.ts` now reads error cells as their code.

## Customer-support English cards (15 Oct 2026)

- 180 cards, 56 fields each (Voice / Chat / Email × Basic / Intermediate / Advanced), workbook `content/support-cards/Support_Cards_EduSarthi.xlsx`, JSON `support.json`, sources and tools in `content/support-cards/source/`, audit logs in `content/support-cards/audit/`. Plan and decisions: `docs/SUPPORT-CARDS-PLAN.md`.
- Two audit rounds done (round 1 per group, round 2 regression per channel + adversarial passes). Status: DRAFT until a verified teacher checks it.
- App **Support chip built** (15 Oct 2026, branch `claude/happy-galileo-167f8x`, owner said "Bana do"): new `CardKind` value `SUPPORT` (additive); `prisma/import-support.ts` loads `support.json` (channel → `Word.category` lower-case, level → `Word.partOfSpeech` "Basic"/…, everything else in `details`) and is a step of Actions → Database setup. Tab: `/flashcards?kind=support&ch=voice|chat|email&lv=basic|intermediate|advanced` (tap an active chip to clear it). Card sides: `components/flashcards/support/` (Front, Back, RealLife, Practice, Tasks), parsers in `lib/supportCard.ts`. Same frame, Known/Unknown/Remark and Day 1·3·7·15·30·60 plan as every card.
- Audit exits: Voice/Chat → "Say the support line for audit" (AUDIO); Email → "Write the support email for audit" (IMAGE, button "Send a photo for audit"). There is no text-only submission type in the app; a photo/screenshot of the written email is the route.
- To go live: merge to main, then run Actions → Database setup once (adds the enum value and the 180 cards).
- Rules not to undo: only [Company] as placeholder; Indian-English forms are "switches", never marked as errors; MCQ answers balanced 5/5/5/5 per group; agents never ask for OTP/PIN/password/CVV/full card number or bank details by email.

## Word sections (15 Oct)

The 2,227 built-in words can be studied by **level** (A1 712 / A2 724 / B1+ 791), **topic** (13 topics folded from 163 categories by ordered regex rules in `lib/wordSections.ts`, first match wins; unmatched go to "More words"), **word type** (code prefix VRB/ADJ/ADV/NOU/PHR/grammar words) and **importance** (5 / 4 / ≤3). Each section is cut into packs of 50 by serial. Pages: `/flashcards/sections` and `/flashcards/sections/[key]`; the session takes `&sec=<key>&pack=<n>` and the Words tab shows a "📂 Sections" chip. A section is only a filter (`Deck.extra` in `lib/flashcards.ts`); no table or migration. The daily new-card limit stays global across sections. Checked locally (Postgres + Playwright): section totals add up to 2,227 in every family; a pack session only serves its own cards; pack progress updates after marking Known. **Goal tracks + section search (15 Oct):** `By goal` family in the same system — Daily English (989), Interviews (684), IELTS and exams (982), Work English (764). Built from topic + level + minimum importance (rules in `TRACKS`, `lib/wordSections.ts`); they are study paths chosen by EduSarthi, NOT an official exam or employer list, and the page says so. The track matching the profile goal (`goal-<value>`) shows first as "For your goal". Search works inside a section: box on the section page, "🔍 Search here" chip in a section session, `/search?sec=<key>` (history remembers the section). Verified: all 30 sections have identical counts from the JS tally and the Prisma filter; "ing" in A1 gave 15 of 39 global, matching the database. Bug caught while testing: a missing `pack` param used to mean Pack 1 — it now means the whole section.

## History: practice + study (26 Oct 2026, branch `claude/zen-noether-2av4n9`)

Done: student `/history` (Practice = recordings and audits; Study = every card answer by day), menu "You → History" and a Profile card, dashboard "Recent activity" card, teacher/admin `/students/[publicId]/history` (teacher only for students they claimed, were assigned or audited; admin any, logged), "History" link on admin Users rows, delete-my-study-history. New table `ReviewLog` (additive), written on every card mark. Full list, decisions and open items: `docs/HISTORY-PLAN.md`.

**Needs before it works live:** merge, then run Actions → Database setup (adds `ReviewLog`; nothing existing is touched). Study history starts that day; earlier answers cannot be recovered.

The DPDP export now includes card progress and study history. Owner decided **no automatic cleanup** of `ReviewLog`. Not done: nothing was rendered in a browser or run on the real database.

## Starting a new chat

Say: **"Read CLAUDE.md and docs/PROJECT-MEMORY.md first."** Before it finishes, ask it to add what changed and what is undecided to this file and push. Chats on different branches only see each other's work after it is merged into `main`.

## Google sign-in and guest (11 Oct, branch `claude/trusting-noether-n3dhu1`)

Done: **Continue with Google** and **Continue as guest** under the login and register forms (`components/auth/SocialSignIn.tsx`), for every role from one page.

- **Google** (`lib/auth.ts`): shown only when `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set (the login page asks `/api/auth/providers`). The `signIn` callback accepts only a Google-verified email, then finds or makes the account with `userForProvenEmail` (the same function the email code uses), so an existing teacher/admin keeps their role, a new email becomes STUDENT, a suspended account is refused, and a password set by someone who registered the address first is removed. No role ever comes from Google. Google users are verified on arrival, so they skip the email code.
- **Guest** (`lib/guest.ts`, `Credentials` provider id `guest`): a real, anonymous STUDENT row with the existing `User.isGuest = true` (no schema change). Capped at 300 new guests per hour. Guests can study flashcards and keep progress; `requireUser({ member: true })` in `lib/apiUser.ts` refuses them on upload-url, submissions, institute, decks (create, cards, media, report, like). The proxy lets a guest open /login and /register to upgrade.
- Tested locally against a real Postgres: guest sign-in, session `isGuest`, 403 on member routes, flashcards still allowed, admin/teacher pages redirect, password sign-in unchanged. **Google itself was not exercised** (needs real Google keys).

Needs before Google works live: create an OAuth client in Google Cloud Console, redirect URI `https://<site>/api/auth/callback/google`, put the ID and secret in Vercel as `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`, redeploy.

Not done, by choice: deleting old guest rows (needs a check of what cascades first), hiding guests from the teacher Students list and admin counts, friendlier guest messages inside Explore's "Import and study".

## AI draft audit (26 Oct 2026, branch `claude/magical-hopper-juy9yr`)

**What it is.** On the teacher's audit page, an audio submission has an "AI draft" card. The teacher presses a button; the server transcribes the recording (OpenAI `whisper-1`, the only model that returns word times and confidence), measures the speech, and asks Claude (default `claude-sonnet-5-5`, override with `AI_DRAFT_MODEL`) for grammar, vocabulary and fluency scores with a reason each, timestamped notes (including hedged "Listen again here: …" pronunciation hints from Whisper's low-confidence stretches) and a student-facing summary. Plan A of the owner's "add AI" request; owner chose it over student-facing instant AI feedback.

**Files.** `lib/aiTranscribe.ts` (Whisper call + `speechStats`: pace, pauses, hesitation sounds, repeats), `lib/aiDraft.ts` (Claude call, Zod-checked, clamps scores, drops notes past the recording end), `lib/aiLimits.ts` (limits, IST day), `lib/mediaBytes.ts` (reads the stored recording; passes the transcription service a generic `audio.<ext>` name, never the student's file name), `app/api/submissions/[id]/ai-draft/route.ts`, `components/review/AiDraftPanel.tsx`, edits to `components/review/RubricForm.tsx` (`applyAiDraft`), the new `AiDraftLog` table in `prisma/schema.prisma`, and a paragraph + two processors on `app/(public)/legal/privacy/page.tsx`.

**Decisions not to undo.**
- AI never scores **pronunciation** or **confidence** (a transcript cannot show either); those stay the teacher's. Pronunciation help is notes only, worded as a guess.
- Only audio, only the teacher holding the claim (or an admin who claimed it), any teacher may use it. Limits: 500 drafts per teacher per **IST** day, 3 per submission, counted in `AiDraftLog` (row written when asked, not when it succeeds).
- The AI fills the form automatically but only what the teacher has not done: sliders move yet stay "not set" until the teacher confirms each (the existing guard against sending an unheard audit), summary only if empty, notes are added without duplicates. Nothing goes to the student except through the teacher's normal submit.
- **No "AI" label on the student's feedback** (owner's decision, against the assistant's advice). The privacy page does disclose that audio and text go to OpenAI and Anthropic when a teacher asks for a draft.
- Only the transcript is stored (`Submission.transcript`); the draft itself is not.
- The transcript is student speech and is put in `<transcript>` tags with an instruction to treat it as data, so a student cannot talk the AI into a score.

**Not tested against the real services** (no keys in the cloud session): tested with a mocked OpenAI/Anthropic on a local Postgres, a running dev server and Playwright (9 route cases, limits, IST boundary, form fill without overwriting). Still to verify with real keys: that Whisper keeps grammar mistakes in the transcript (it tends to tidy speech; the prompt asks it not to), the Supabase signed-URL read path, and how close the drafts are to real audits (compare 10-20 before relying on it).

**To go live.** Merge; set `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` in Vercel (spend limits on both dashboards); run **Actions → Database setup** once (adds the `AiDraftLog` table; nothing existing changes). Privacy page promise: "Changes" says account holders are emailed before a change takes effect — adding two processors is such a change; the owner should decide how to notify. The page is a draft and still needs a lawyer's review.

**Open / not built.** Plan B (AI card generation) is now built: see "AI card maker" below. Known gaps of the audit draft: `RubricForm.tsx` is 266 lines (it was 263 before the AI work; the draft-merge and send logic now live in `components/review/auditClient.ts`; the rest is the form's own state); pre-existing hydration mismatch in `ClaimTimer` (`components/review/ClaimControls.tsx`); the draft is lost on reload and asking again counts toward the limits; no cost log beyond the count; no fallback for Claude safety refusals (the teacher is told to write by hand).

## AI card maker (26 Oct 2026, branch `claude/magical-hopper-juy9yr`)

**What it is.** On a deck's page, "Make cards with AI": the person says what they want cards for (a word, sentence, topic, chapter, concept or book) and may add pasted text, a PDF or a photo; the AI asks 3-6 questions (language only when it matters; which parts each card needs; how many); it makes cards grouped into chapters; the person reads, edits, unticks or removes them; only then "Add" puts them in the deck. Open to every signed-in member (students too), not guests. Plan B of the owner's "add AI" request.

**Files.** `lib/aiCards.ts` (the two model calls and size check, 201 lines), `lib/aiCardQuestions.ts` (pure rules for the questions and remembered answers; re-exported from aiCards), `lib/aiCardPrompts.ts` (the two prompts: tune these first), `lib/aiCardSchemas.ts` (request limits, client-safe), `lib/aiCardLimits.ts` (allowance), `lib/aiCardPrefs.ts` (remembered answers), `lib/aiSources.ts` (PDF/photo sources), `lib/mediaBytes.ts` (shared with the audio draft), routes under `app/api/decks/ai-cards/{questions,make,sources}` and `app/api/decks/[id]/ai-cards` (the add), components `components/decks/Ai*.tsx` and `ChapterIndex.tsx`, `AiBadge`, and changes to the deck editor, My decks, library, admin review, study and share pages. Schema: `User.aiCardsUsed`, `User.aiTokensUsed`, table `AiSource`.

**Decisions not to undo.**
- **Free allowance: 100 AI cards in total per account, for life, not per day.** Counted when the AI makes them (even ones the person drops). Reserved in one SQL statement before the model runs and given back if it fails, so parallel requests cannot overshoot (tested: 5 at once at 95 -> exactly 100). Admins are not limited. A token ceiling of 1,500,000 per free account also applies (`FREE_TOKENS_TOTAL`, our guess; raise it if PDFs are common).
- **No paid plan exists yet.** Everyone except admins is on the free allowance. The owner wants an automatic paid system based on tokens later; `aiTokensUsed` already records every call's tokens, and `lib/aiCardLimits.ts` is the one place to change. Not decided: whether "tokens" will mean model tokens or EduSarthi credits users buy.
- **The AI always asks first, every time**, with the person's last answers pre-selected (`User.preferences.aiCards`, only the ids language, level, purpose, sections, style, count). A remembered answer beats the model's guess. The "how many cards" question is forced by the code.
- Cards are simple deck cards (front, back, example, markdown notes) so they keep the one EduSarthi card look; the chapter is in `Word.category`; fields are not fixed (the notes hold whatever sections the person chose). Not the 56-field format (that stays admin/Excel, audited).
- **"AI-assisted" label** on every AI card and on decks that hold some (editor, My decks, study and library card pages, library, share page, admin review, institute page). Stored in `Word.details.aiAssisted`, set only by the AI add route, carried over on edit and copy, never taken from a request. On the study and library card screens the badge sits outside the card.
- Disclaimer shown with the panel and drafts: "EduSarthi can make mistakes. Check important info." (owner's wording).
- Max 10 cards per request (output is slow; 20 can pass a serverless time limit). The make route sets `maxDuration = 300`; Vercel clamps it on plans that allow less.
- Sources: pasted text up to 30,000 characters, PDF/JPG/PNG/WebP up to 10 MB each, at most 5 items, and at most 60,000 input tokens per request (counted with Anthropic's free token counter before the real call). Files go straight to storage by a checked upload address, are re-checked against their first bytes, are deleted once the cards are made, and by the daily retention cron otherwise. That cron runs once a day and removes files older than 24 hours, so a file can wait up to two days; the privacy page says "up to two days".
- The pasted text and files are the person's own words; both prompts tell the model to treat them as material, never as instructions.

**Tested** with a fake model on a local Postgres, a running dev server, real sign-in and Playwright at phone width: questions, remembered defaults, 100-card cap and parallel overshoot, failure refund, admin exemption, token ceiling, sources (types, size, fake PDFs, other people's ids, cap of 5, delete, sweep, account deletion), the whole panel, the label on every screen, edit/copy keeping the label, chapter index in My decks and the editor.

**Not tested against the real services** (no keys in the cloud session). **How to test them: `docs/AI-LIVE-TEST.md`, using `scripts/ai-smoke.ts` (runs the real calls from a laptop, no database, no deployment).** To check with real keys: whether the questions are good, how good the cards are (and which prompt lines to tune), how long ten cards take against the Vercel time limit, what a real PDF costs in tokens, that Supabase accepts a PDF upload to the bucket (bucket type/size rules), and that the retention cron really removes waiting files.

**Off until the keys exist (added 26 Oct).** `lib/aiEnabled.ts`: without `ANTHROPIC_API_KEY` the card maker panels are not shown (deck page, My decks); the audio draft button needs both `ANTHROPIC_API_KEY` and `OPENAI_API_KEY`. The draft route refuses (503) before it counts anything, so clicks with no keys cannot use up a submission's 3 drafts. So the code can be merged before the keys are set. **Run Database setup before or right after the merge**: the live app reads the new `User` columns on ordinary sign-in queries, so a deploy without them can break sign-in until the tables are updated.

**To go live.** Merge; set `ANTHROPIC_API_KEY` (and `AI_CARDS_MODEL` to change the default `claude-sonnet-5-5`); run **Actions -> Database setup** once (adds `aiCardsUsed`, `aiTokensUsed` and the `AiSource` table; nothing existing changes). `CRON_SECRET` must be set for the retention cron that sweeps waiting files. The privacy page now describes the card maker; the "Changes" section promises to email account holders before a change takes effect, and this is a new use of an existing processor, so the owner should decide how to tell people. The page is a draft and needs a lawyer's review.

**Make a new deck with AI (added 26 Oct):** My decks has the same panel without a deck id; the person names the deck (suggested from the request) and `POST /api/decks/ai-cards/new-deck` creates the deck and its cards in one transaction (20-deck limit, nothing half-made), then opens it. Both add routes build rows with `lib/aiCardRows.ts`.

**Open / not built.** Paid plans and token-based billing; pictures or audio on AI cards (add later with Edit); sources limited to what the person gives (the AI cannot read a whole book by title); the panel keeps drafts only in the browser (a reload loses them, and they still count toward the 100); 

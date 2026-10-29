# Student dashboard — redesign plan

Status: **Phases 1–4 BUILT and audited (29 Oct 2026, branch `claude/hopeful-heisenberg-04ufep`, not merged yet). After merging, run Actions → Database setup once, straight away (two new tables and one new column).** Written 29 Oct 2026 on branch `claude/hopeful-heisenberg-04ufep`. This chat works only on the dashboard.

Mockup: `docs/dashboard-mockup.html` (open in a browser; phone and computer, the special states and the two sheets; a Light / dark button checks the tokens). Screenshots: `docs/dashboard-mockup-phone.png`, `docs/dashboard-mockup-desktop.png`, `docs/dashboard-mockup-states.png`, `docs/dashboard-mockup-sheets.png`. The same screens are on a private design canvas for the owner, "EduSarthi student dashboard" (https://claude.ai/artifact/BMBLa2RjthqFGsgwCZokCs), each artboard with a Theme tweak; the repo files are the record.

## Owner's answers (29 Oct 2026)

| Question | Answer |
|---|---|
| Which dashboard? | **Student only** (`/dashboard`). Teacher and admin are not in this round. |
| What comes first? | **Today's work.** Progress and charts go lower or to the Progress page. |
| How much game? | **Medium:** streak, daily goal ring, badges, XP, level, weekly goal, streak freeze. **No leaderboard.** |
| What to deliver now? | **List + design.** Build later, in phases, after approval. |
| The seven open questions (second round, same day) | **All recommendations accepted**, except: **the score trend chart stays on the dashboard** too. Then: "make the complete plan, then start Phase 1". |

## What the dashboard has today (and what is wrong with it)

Twelve blocks, in this order on a phone: greeting → "do this next" + streak + today's goal → three count tiles → notices → with a teacher → score trend chart → this week bars → recent activity → rubric first-to-latest → latest audit → what to work on → flashcards → audits received.

Problems found in the code:

1. **Too long on a phone.** The right column (`aside`) drops to the very bottom, so "What to work on" is the 11th block.
2. **The streak counts recordings only** (`lib/progress.ts`). A student who studies flashcards every day has a streak of 0. Recordings are limited to 2 a day, so the streak depends on the scarcest action. The "3-day streak" badge says "Record 3 days in a row" for the same reason.
3. **"Cards due" counts Words only** (`deckCounts(..., { kind: "WORD" })`). Chunk, Grammar, Support and deck cards that are due never show; `/today` already counts every kind.
4. **The same thing is said three or four times:** "With a teacher", "Recent activity", "Latest audit" and "Audits received" all show recordings.
5. **"What to work on" names the weakest skill but its button goes to all modules.** Modules have no skill tag, so a direct link is not possible yet.
6. **Recordings left today (2 a day) is not shown** on the dashboard, only on practice pages.
7. **Guests see "Recording today 0/1"** although guests cannot record.
8. The week bars use `CardState.lastReviewedAt`, which keeps only each card's last review; `ReviewLog` (since 26 Oct) has every answer.
9. Nothing shows for a brand-new student except empty boxes. Research says the first week decides whether a learner stays.

The Progress page (`/progress`) already has the score trend, rubric change, the week and the flashcards, so moving those off the dashboard loses nothing.

## The new dashboard: what to show, in order

Nine blocks on a phone instead of twelve, each smaller. Blocks with nothing to say are not drawn (no empty boxes).

| # | Block | What it shows | Data | Exists? |
|---|---|---|---|---|
| 1 | **Greeting + chips** | "Hello, Riya" and one line that changes with the day ("2 things left today", "Today's goal done"). Chips: 🔥 streak, ⭐ XP. Tapping a chip opens its sheet (see Sheets). | name, streak, XP | name yes; streak changes; XP new |
| 2 | **Today card** | Daily goal ring (e.g. 28 / 40 XP), streak status ("Safe for today" or "Earn 10 XP to keep your 12 days"), the week as seven day dots (goal met ✓, freeze ❄, missed, today outlined) and "Week: 3 of 5 days". | XP per IST day, weekly goal, freezes | new (computed; freeze needs storage) |
| 3 | **Do this next** | One card, one button. Priority: re-record a sent-back recording → a notice due today → cards due (all kinds and decks) → new cards → next untried exercise → practise again. | `nextAction` | yes, widen to all kinds |
| 4 | **Today's tasks** | A checklist; each row has a count and a link, done rows get a tick: Review due cards (Words 9 · Chunk 5 · Grammar 4), New cards (10 left), each deck with cards due, Send a recording (2 left today), Re-record "…" (red, on top when present). Replaces the three count tiles. | `todayReview`, `auditAllowance` | yes |
| 5 | **With your teacher** | Up to three recordings still with a teacher (waiting / being reviewed / sent back), then the latest audit in one row: average, change since the one before, five small bars, "Read it". Replaces With a teacher + Latest audit + Audits received + Recent activity. | submissions, feedback | yes |
| 6 | **Notices** | Only when there are any; at most three, "See all". A notice dated today also appears in Today's tasks. | `activeNotices` | yes |
| 7 | **Your skills** | The five rubric scores as bars (latest audit), each with its change since the first audit (↑ +1, ↓ −1). The lowest is highlighted with "Work on fluency next" and a button. Before two audits: one line saying what will appear. "Full progress →". | feedback rows | yes |
| 8 | **Flashcards** | Known / learning / doubts, one bar per kind (Words, Chunk, Grammar, Support), "Revisit first: <topic> (6)" → My card lists. | `cardProgress` (extend per kind) | mostly |
| 9 | **Score trend** | The existing chart (average of the five scores, audit by audit; owner's decision to keep it here). Hidden until there are two audits. | feedback rows | yes |
| 10 | **Stage and badges** | "Stage 5 · 1,240 XP", a bar to the next stage ("260 XP to Stage 6"), the next badge with its progress ("7-day streak: 2 days to go"), the last three badges earned → Profile. | XP, `badgesFor` | XP new; badges yes |

(Block 1 is the page heading, so the blocks a student scrolls through are 2–10.)

**Moved off the dashboard to Progress / History** (already there): the rubric first-to-latest table, the seven-day bars, the recent-activity list, the "audits received" count.

### Phone and computer

- **Phone (390 px):** one column in the order above. At 390×844 the Today card and Do this next are fully on the first screen and Today's tasks starts below them, so a student sees what to do without scrolling.
- **Computer (≥1024 px):** two columns. Left (wide): Do this next, Today's tasks, With your teacher, Your skills, Score trend, Flashcards. Right (320 px): Today card, Level and badges, Notices.

### Special states (each is in the mockup)

| State | What changes |
|---|---|
| **Streak at risk** (after 6 pm India time, under 10 XP today, streak ≥ 1) | Today card turns saffron: "Keep your 12-day streak: 10 cards take about 3 minutes." Do this next = the quickest task. |
| **Goal done** | Ring full with a tick; line "Today's goal done. Anything more is a bonus." One short animation, none with Reduce motion. |
| **New student** (fewer than 3 learning days) | A "Getting started" checklist replaces blocks 7–9: set your goal (Profile), learn your first 10 cards, send your first recording, get your first audit. Each tick earns XP. |
| **Guest** | No recording rows. A "Keep your progress" row (Settings) sits in Today's tasks. Streak and XP still work, so the guest has something to keep. |
| **Freeze used** | The missed day's dot shows ❄ and the Today card says "A streak freeze saved your 12 days yesterday." |

### Sheets (open from the chips; same `Sheet` as Settings)

- **Streak sheet:** this month as a calendar (learning days filled, ❄ freeze days), current and longest streak, freezes held (0–2), and the rules in three lines.
- **XP sheet:** XP today / this week / total, the stage bar, and the honest list of how XP is earned (below). No hidden rules.

## The game rules (accepted 29 Oct; numbers to tune after real use)

All XP is computed from rows that already exist (`ReviewLog`, `Submission`), the way badges are today (`lib/badges.ts`, nothing stored). Only the streak freeze needs stored state.

**XP — effort, never scores.** Rewarding audit scores would punish a weak recording and push students away from honest practice.

| Action | XP | Guard against farming |
|---|---|---|
| Learn a new card (first answer ever) | +2 | once per card |
| Review a card you have seen | +1 | only the first answer of each card per India day |
| Send a recording for audit | +10 | already limited to 2 a day |
| Re-record a sent-back recording | +10 | only real replacements (`retryOfId`) |
| Deck cards (own, shared, followed) | same as above | same |

**Daily goal (the ring):** chosen in Settings → Flashcards: Easy 20 XP (about 5 minutes), Regular 40 (default, about 10), Serious 60, Intense 100. Times are rough and the screen says "about".

**Streak:** a day counts when the student earns **at least 10 XP** in India time (about 10 reviews, 5 new cards or 1 recording). Flashcards now count, so nobody's current streak goes down when this ships; most go up. The daily goal is the stretch; the streak is the minimum.

**Weekly goal:** days in the week (Monday–Sunday, India time) on which the daily goal is met: 3, 5 (default) or 7.

**Streak freeze:** earned, never bought (there is no shop or currency). Meeting the weekly goal earns one; at most 2 held; a new account starts with 1, because the first week is when a miss hurts most. A freeze is used automatically on a missed day. **No paid or after-the-fact repair.**

**Stage (the XP level):** Stage *n* starts at 50·n·(n−1) XP: Stage 2 at 100, 3 at 300, 4 at 600, 5 at 1,000, 10 at 4,500. At 40 XP a day that is Stage 5 in about 25 days and Stage 10 in about four months.

**Badges:** stay computed. Re-word the streak badges to "learning days" and add: 30-day streak, first weekly goal, 4 weekly goals, 500 cards known, 10 recordings, first 100-XP day. The dashboard shows only the next badge and the last three earned; the full list stays on Profile.

**Not included, on purpose:** leaderboards or any ranking (owner's decision; research below shows harm to weaker students, and many students may be minors), gems, coins or a shop, hearts or lives, push notifications (the daily reminder email already exists; a "streak at risk" line in it is a later idea).

## Research behind this

Facts are marked with how sure we are. Full source list at the end.

1. **Gamification helps a little, on average.** Two meta-analyses: Sailer & Homner 2019 (cognitive g = .49, motivational g = .36, behavioural g = .25) and Huang et al. 2020 (g = .46, 30 studies). CONFIRMED (peer-reviewed meta-analyses). The effect is small-to-medium, not magic.
2. **Competition alone is weak; leaderboards upset weaker students.** Sailer & Homner found competition alone had no clear behavioural effect, while competition with collaboration did. Reviews of EFL gamification (Zhang & Hasim 2023) and high-school/college gamification (Ratinho & Martins 2023) report negative effects of competition for less competitive students. A peer-comparison dashboard study (Fleur et al. 2023) found 65% of the feelings students reported were negative. CONFIRMED.
3. **Novelty wears off.** Intrinsic motivation can fall over time under points and badges (Ratinho & Martins 2023). LIKELY. So XP stays a small part of the screen, and the main message is the task and the teacher's feedback.
4. **Tell students what to do next.** Dashboards that recommend an action raise motivation to act more than raw numbers (Herodotou et al. 2025; Bodily et al. 2018; Paulsen & Lindsay 2024 review). CONFIRMED (small studies). This is why "Do this next" and Today's tasks lead.
5. **Show progress against yourself, not others.** Self-referenced progress and progress bars help; peer averages can demotivate students above and below the average. LIKELY.
6. **Goal setting increases practice.** Learners who set and checked goals in a vocabulary app studied more words (He & Loewen 2022), though test scores did not differ. CONFIRMED for engagement, not for test results. Self-chosen goals support ownership. LIKELY. This is why the daily and weekly goals are the student's choice.
7. **Streaks keep people coming back, the first week most of all.** Duolingo's retention team calls the streak its biggest growth lever and says going from day 1 to day 2 is a big jump (Lenny's Podcast, 2023). LIKELY (company statement, not a study).
8. **Strict streaks cause anxiety; forgiving ones are safer.** Babbel gives two freezes a week, used automatically; Duolingo lets learners hold up to two. Writers on streak design warn about anxiety and shame when one missed day wipes a long run. A consumer study (reported second-hand by The Decision Lab) found people try less to keep a streak they know they can repair. UNVERIFIED (the original paper was not read). So: earned freezes yes, repair no.
9. **Weekly view.** Duolingo's "perfect streak week" and Babbel's weekly view; Busuu's study plan sets how many days a week. CONFIRMED that these products do it; no study on whether it beats a daily-only view.

## Decisions (29 Oct 2026, owner accepted every recommendation)

1. The XP level is called **Stage** ("Level" stays for the English level and the module level).
2. A streak day needs **10 XP** (India day).
3. Daily goal choices **20 / 40 / 60 / 100 XP**, default **40**.
4. Weekly goal default **5 days**; a freeze is earned per weekly goal met, at most **2** held, a new account starts with **1**.
5. **Deck cards earn XP** (own, shared, followed decks).
6. **Guests get streak and XP.**
7. **The score trend chart stays on the dashboard** (owner's change to the recommendation), as block 9.

## Complete build plan

Every phase touches more than six files; the owner approved the plan and Phase 1 on 29 Oct ("complete plan bana k do, fir phase 1 start kar do"). Phases 2 and 3 start when the owner says so.

### Phase 1 — the new dashboard on today's data (no schema change, no new setting)

What the student sees:
- Greeting with a one-line summary, and two pills: 🔥 streak and ⭐ XP · Stage (plain pills; they become buttons in Phase 2).
- **Today card:** the daily goal ring (default 40 XP until Phase 2 adds the setting), streak and its status, the week as seven day dots (goal met, learned but goal not met, missed, today, still to come), "Week goal: N of 5 days". Variants: **streak at risk** (after 6 pm India time, under 10 XP today, streak ≥ 1) and **goal done**.
- **Do this next** over every card kind and deck: re-record → cards due (the kind with most due, else a deck) → new words → first exercise never tried → practise again. A brand-new student is sent to their first 10 words.
- **Today's tasks** (each row links; done rows ticked): Re-record "…" (only when one is sent back), Review due cards (every built-in kind, with the split), each deck with cards due (up to 2, then "+N more" → `/today`), Learn new words (Words tab, today's limit), Send a recording for audit (what is left of today's allowance) — for a guest, "Keep your progress" → Settings instead.
- **With your teacher:** up to three recordings still with a teacher, then the latest audit: average, change from the audit before, five small bars, the summary trimmed, "Read it in full". Hidden for guests and for students who have never sent one.
- **Notices** (up to three, "See all").
- **Your skills:** each rubric score's average over all audits as a bar, the change from first to latest audit, the lowest highlighted with "Practise speaking" and "Full progress". Before the first audit: one line.
- **Score trend** (existing chart, kept by the owner).
- **Flashcards:** known / learning / doubts, known out of all cards for Words, Chunk, Grammar and Support, and "Revisit first: <topic>" → My card lists.
- **Stage and badges:** stage, bar to the next stage, the next badge with how far to go, up to three earned badges → Profile.
- **New student** (fewer than 3 learning days and not every step done): a "Getting started" checklist — set your level and goal (Profile), learn your first 10 cards, send your first recording, get your first audit back — replaces Skills, Score trend, Flashcards and Stage. Guests get the first two steps and "Keep your progress".
- Computer: two columns (left: next, tasks, teacher, skills, trend, flashcards; right: Today card, stage and badges, notices).

How it is built:
| File | Change |
|---|---|
| `lib/xp.ts` (new) | The XP rules as constants and one function that reads XP per India day: cards from `ReviewLog` (first answer of each card per day; +2 if the card's `CardState` was created that day, else +1) and recordings from `Submission` (+10 each). Two grouped SQL reads, bounded to 400 days for the day series plus an all-time total. |
| `lib/streak.ts` (new, no database) | Streak (days ≥ 10 XP, counted back from today or yesterday), the week's dots, learning days, stage from total XP (`Stage n` from 50·n·(n−1) XP), streak-at-risk check. Replaces `lib/progress.ts`. |
| `lib/dashboard.ts` (new) | Reads everything the page needs in parallel and returns plain data, so the page only lays it out. |
| `lib/dashboardTasks.ts` (new, no database) | Today's task rows and the summary line. |
| `lib/dashboardNext.ts` | "Do this next" over every kind and deck, plus the new-student step. |
| `lib/studentStats.ts` | Card progress also returns known / total per kind. |
| `lib/badges.ts` | Streak badges count learning days (any study, not only recordings); new badges: 30-day streak, 10 recordings, 500 cards known, first 100-XP day; each badge carries how far along it is, for "next badge". |
| `app/(shared)/profile/page.tsx` | Badge numbers from the same streak and XP, so Profile and Dashboard agree. |
| `components/dashboard/*` | New: `TodayCard`, `NextCard`, `TodayTasks`, `TeacherCard`, `SkillsCard`, `KindsCard`, `StageCard`, `GettingStarted`, `StatPills`. Kept: `ScoreTrend`, `NoticesCard`, and for the Progress page `CardProgress`, `CriteriaChange`, `WeeklyActivity`. Removed: `TodayStrip`, `TodayWork`, `InFlightCard`, `LatestAudit`, `WhatToWorkOn`, `RecentHistory` (the History page has recent activity). |
| `app/(student)/dashboard/page.tsx` | Rewritten as layout only. |
| `app/(public)/help` | "How do XP, streaks and stages work?" |
| Docs | `docs/FEATURE-MAP.md`, this file, `docs/PROJECT-MEMORY.md`. |

Checks before pushing: `tsc`, `next build`; a local Postgres with the real card imports and test students (normal day, new student, guest, a sent-back recording, decks due, a student with audits); XP and streak numbers checked by hand against the test data; the pure functions run against fixed dates (streak across midnight India time, at-risk after 6 pm, Monday week start); Playwright at 390×844 and 1280×800 for each state; axe (WCAG 2.1 AA) on the dashboard in all five themes; no hard-coded colours.

**History limit:** `ReviewLog` exists only since study history went live (code on 26 Oct 2026, the live table from the Database setup run of 27 Oct), so card XP and card days start then; the screens say "late October 2026"; recordings count from the start. Nobody's streak goes down, because recordings still count.

#### Phase 1 — what was built and how it was checked (29 Oct)

Built as planned, with these differences:
- The score trend is its own card ("Your average, audit by audit", from the second audit), right after Your skills.
- The Notices card has no "See all" link on the dashboard; Menu → Today's tasks → Notices already lists them all.
- `components/ui/Badge.tsx`: the error badge's tint is lighter (`bg-error/8`), because axe measured "Sent back" at 4.29:1 in the light theme. This also changes the "Sent back" badges on the Audited page, for the better.
- Lib files: `lib/streak.ts` holds the rules and date logic (no database, so a client component can read the rules in Phase 2); `lib/xp.ts` reads XP; `lib/dashboard.ts` reads everything for the page; `lib/dashboardTasks.ts` and `lib/dashboardNext.ts` decide rows and the next step. `lib/progress.ts` is gone (its recording-only streak was the bug).
- Profile shows 12 badges (was 8); the streak badges now say "Learn N days in a row" and are earned from the longest streak, so a missed day does not take one away.

Checked on a local Postgres with the real card imports and six test students (normal day, a sent-back recording, brand new, guest, goal done, evening):
- 42 checks of the numbers, worked out by hand first: streak across midnight India time, Monday week start, stages at 0 / 100 / 1,240 / 4,500 XP, the evening rule at 5:50 and 6:10 pm, and for each student the XP, streak, task rows, summary line, next step, latest audit, skill averages, per-kind counts, badges and next badge.
- A production build, then Playwright at 390×844 and 1280×800 for five students: every page 200, no sideways scroll, no browser errors, and axe (WCAG 2.1 AA) clean on the page in all five themes at both widths: 79 checks. The first run found three problems, all fixed: 1 px of sideways scroll from the teacher card's grid, the muted text on the "do this next" tint (4.46:1), and the error badge (4.29:1).
- The evening ("streak at risk") state could not be shown on a running server: a test-only fake clock broke sign-in. The rule is covered by the date checks above, and the Today card's four states (at risk, safe, goal done, no streak) were rendered on their own and checked by eye and with axe in all five themes.
- `tsc` and `next build` pass.

Not checked: the live database, a real phone, and how long the XP query takes for a student with a very long history (it reads every `ReviewLog` row of that student on each visit; fine for months of study, worth a look if a student passes about 100,000 answers).

To go live: merge. No Database setup run is needed (no schema change).

### Phase 2 — settings, sheets and moments (no schema change)

- Settings → Flashcards: **Daily goal** (Easy 20, Regular 40, Serious 60, Intense 100 XP) and **Weekly goal** (3, 5 or 7 days) rows with sheets, preferences `dailyGoalXp` and `weeklyGoalDays`.
- The two pills become buttons: **Streak sheet** (this month as a calendar, current and longest streak, the rules) and **XP sheet** (today, this week, total, stage bar, the full XP table, "XP counts from 26 Oct 2026", link to the daily goal).
- Goal-done moment: a short tick animation on the ring, none with Reduce motion.
- Help and `LIVE-TESTING-GUIDE.md` steps.

#### Phase 2 — what was built and how it was checked (29 Oct)

The owner said "start building next phase". Built as planned, no schema change:
- **Settings → Flashcards → Daily goal** (Easy 20, Regular 40, Serious 60, Intense 100 XP) and **Weekly goal** (3 days, 5 days, every day), preferences `dailyGoalXp` and `weeklyGoalDays` in `User.preferences` (`lib/preferences.ts`; choices listed once in `lib/streak.ts`). Old accounts read the defaults; a value outside the list falls back to the default. The rows open from `/settings#daily-goal` and `#weekly-goal` (`PrefChoiceRow` takes an `anchor`).
- The dashboard reads both: the ring, the summary line, the week dots, "Week goal: N of M days" and the calendar all use the student's goal. "Goal: N XP a day" on the Today card links to the Daily goal sheet.
- The pills are buttons now (`StatPills`, client). **Streak sheet** (`StreakSheet`): longest streak, this week against the goal, this month as a calendar (light green = streak day, dark green = goal met, today ringed; past days with too little XP are plain, never marked as missed), the rule, a link to the goals. **XP sheet** (`XpSheet`): stage bar, XP today / this week / best day, every XP rule from the same constants the counting uses, "Card XP counts from 26 Oct 2026", a link to the Daily goal sheet. Both use the Settings `Sheet`; their content is rendered on the server and handed in.
- **Goal moment** (`GoalTick`): when the ring is full, the tick pops once per day per device (remembered in localStorage; the copy hidden by its breakpoint does not claim the day). No animation with the phone's reduce-motion setting or Settings → Reduce motion (`globals.css`, `goal-pop`).
- Help's XP answer and `LIVE-TESTING-GUIDE.md` section 4d (a phone checklist for the whole dashboard) are updated.

Checked on a local Postgres (same test students as Phase 1):
- 13 new number checks (month grid and its first weekday, February, week XP from Monday, defaults and bad stored values, a student switched to 20 XP and 3 days, the sheet numbers), plus the 42 Phase 1 checks again: all pass.
- 50 browser checks: the streak sheet opened by keyboard (focus moves in, Escape closes, focus returns to the pill), the XP sheet by tap and Done; axe in five themes on both sheets at both widths and on the Daily goal sheet; the XP sheet's goal link opening Settings with the Daily goal sheet open; choosing 20 XP and 3 days saved (PATCH 200, stored in the account) and the dashboard following them; the tick popping once and not on reload; no animation under either reduce-motion setting; no browser errors. Then the 79 Phase 1 browser checks again: all pass. Settings for a student and a guest: both goal rows, axe clean in five themes.
- Found and fixed: the calendar's light-green days had green text at 4.12:1; they now use ink.
- `tsc` and `next build` pass.

To go live: merge. No Database setup run is needed.

### Phase 3 — streak freeze and weekly badges

- Freezes: start with 1, earn 1 per weekly goal met, hold at most 2, used by itself on a missed day; the Today card says when one saved the streak; ❄ on the week dots and the month calendar.
- Storage: one additive table (`StreakFreeze { userId, day }`) so a used freeze never changes when goals or history change later. Database setup once; no existing data touched. (A fully computed freeze needs no table but would change past days when a student changes their goal; decide when building.)
- Badges: first weekly goal, four weekly goals.

#### Phase 3 — what was built and how it was checked (29 Oct)

The owner said "start building next phase" again.

**Schema change, additive only — no existing data is touched or lost:** two new tables, `StreakFreeze` (`userId`, `day` "YYYY-MM-DD", unique per user and day) and `StreakLedger` (`userId` as key, `held`, `weeksMet`, `checkedThrough`), both deleted with the user (cascade). **Run Actions → Database setup once after merging.** Until then the dashboard and Profile work as in Phase 2 with no freezes (`settleFreezes` catches the missing table and logs once); only the data export (`/api/me`) needs the tables.

Decisions made while building (the assistant's, within the accepted rules):
- **Stored, not recomputed** (`lib/freeze.ts`). Each India day is settled once, in order, up to yesterday, when the dashboard or Profile opens, and never redone. Recomputing would let a goal change move past freezes: lowering a goal could revive an old streak, raising it could erase today's.
- **Freezes start when a student is first seen after this ships**, with 1 held; earlier history is not re-judged. `weeksMet` (for the weekly badges) also counts from then.
- **A freeze is spent only on a missed day that would break a live streak** (the day before was a streak day or frozen). Two held freezes cover a two-day break the student comes back from. When the days being settled show a break longer than the freezes held, the freezes spent on that break are given back (corrected in the audit; see "Audit").
- **A frozen day keeps the streak but does not add to it** (5 days, a freeze, then today = still 5 until today counts).
- Sunday ends the week (Monday to Sunday, India time); a week with the goal met on at least the weekly-goal days earns one freeze (at most 2 held) and counts towards the badges "Weekly goal met" and "Four good weeks" (Profile now lists 14 badges).
- Two tabs settling at once cannot spend two freezes: the ledger update only matches the day it read, inside one transaction with the freeze rows.
- A guest's ledger is not moved by "Keep your progress" merging into another account (only cards and history move, as before); the account keeps its own.

What shows: ❄ on frozen days in the week dots and the month calendar, "❄ N freezes" on the Today card, "A freeze saved your streak yesterday.", the streak sheet's "N of 2 streak freezes ready" and the freeze rule; Help explains it; the data export includes the ledger and frozen days.

Checked on a local Postgres: 17 checks of the freeze rules on fixed dates and against the database (covering a miss, no cover after the last freeze, two misses with two freezes, nothing spent with no streak, earning on Sunday, the cap of 2, the frozen day not adding to the count, the week dots and calendar, a student who missed yesterday keeping a 5-day streak, a second visit spending nothing, a new ledger starting at 1 without judging the past, two visits at once spending one freeze, and the page still working with the table renamed away); the 42 Phase 1 and 13 Phase 2 number checks again; 30 browser checks (the frozen state on phone and computer, the streak sheet, axe in five themes on the dashboard and the sheet, Profile's new badges, the export) and the 79 + 50 earlier browser checks again: all pass. `tsc` and `next build` pass.

Not checked: the live database (needs the merge and Database setup), a real phone, and a day boundary passing while the page is open (the next visit settles it).

#### Phase 4 — polish: header stats, reminder line, practise the weakest skill (29 Oct)

The owner chose this from the ideas list ("Polish + small ideas"). **Schema change, additive only:** one nullable column `Module.focus` (the rubric skill a module practises most, `lib/skillFocus.ts`). Nothing existing is touched; Database setup adds it (the same run as Phase 3's tables). Every existing module read uses an explicit `select`, and the dashboard's one query on `focus` is caught, so nothing breaks in the minutes before Database setup runs; only Admin → Content needs the column.

Built:
- **Streak and XP in the header on every student page** (`components/layout/HeaderStats.tsx`, row 2 of the header on a computer; phones have no room and keep the dashboard pills). It asks the new `/api/progress` (students only; teachers and admins get 404) after every page change, because the header lives in a layout that Next does not re-render on client navigation. Hidden on the dashboard, which has the same pills. Row 2 of the header now shows only when it holds a link (`md:has-[a]:block`), so it never shows as an empty bar while loading or on the dashboard. Each number links to the dashboard.
- **Daily reminder email:** when the student has a streak and has not yet earned 10 XP today, one extra plain line: "Your 6-day streak needs 10 XP today, about 10 reviews." No line when today already counts or there is no streak. The email is still sent only when cards are due (`lib/studyReminders.ts`, `streakNow` in `lib/freeze.ts`).
- **Practise the weakest skill:** Admin → Content → a module's Edit form has "Skill focus" (none or one of the five rubric skills), and the CSV import takes an optional `skill_focus` column for new modules. When a module is tagged with the student's lowest skill, the dashboard's button says "Practise fluency" and opens `/modules?focus=fluency`, which shows only those modules with a "Show all modules" link. With no tagged module for that skill, the button stays "Practise speaking" and opens every module. **Nothing is tagged yet: an admin has to tag modules for this to show.**

Checked on a local Postgres: 7 new number checks (the button with no tag, with another skill's tag, with the right tag; three reminder emails: streak line only for the student with a streak and under 10 XP today), the freeze, Phase 1 and Phase 2 number checks again; 22 browser checks (header stats on /today and Settings, updating to 486 XP after a client-side page change, no header row on the dashboard or on a phone, teacher refused by the API, admin saving a skill focus, the student's "Practise fluency" opening the filtered list and "Show all modules", axe in five themes on the header and the filtered modules page, no browser errors), and the 79 + 50 + 30 earlier browser checks again: all pass. `tsc` and `next build` pass.

Test notes, not bugs: the header's EduSarthi logotype is excluded from axe as before (WCAG exempts logotypes); measuring right after a theme change or with the pointer over a card catches colours mid-fade, so the checks wait for them to settle.

#### Audit of this chat's work (29 Oct, owner: "audit this chat work")

A code review of the whole branch against `main` (bugs first), then a pass against CLAUDE.md's rules and the user-facing copy. Found and fixed:
1. **Freezes wasted on a long break.** Two freezes were spent on a three-day break that ended the streak anyway. Now the freezes spent on a break that cannot be covered are given back (`settleDays`). A break still running at yesterday keeps its freezes spent, because the student may still come back today.
2. **A missed Sunday not covered by the freeze its own week earned.** The week is now closed before Sunday is judged.
3. **Any database error showed a wrong streak.** `settleFreezes` caught every error as "tables missing" and returned no frozen days, so a passing pool timeout shortened the streak. Now only a missing table (P2021/P2022) means "no freezes"; a failed read is thrown like every other query; a failed save still shows the settled result and is retried next visit.
4. **"Delete my study history" said the streak was not affected.** Untrue since XP and streaks count from that history. The confirm now says XP and streak drop to what recordings earned; Help and the XP sheet say the same.
5. **"Card XP counts from 26 Oct 2026" was not true of the live site** (its table arrived on 27 Oct). The screens now say "late October 2026".
6. **The header asked for its numbers where it shows nothing** (on the dashboard, and on phones below the computer breakpoint), each time reading the whole XP history. It now asks only where it shows.
7. **The data export would fail before Database setup** (it selected the new tables in its main query). The freeze data is now read separately and caught; the rest of the download always works.
8. **A re-record did not tick "Send a recording"** (the daily allowance excludes replacements, but XP counts them). The task now counts every recording sent today.
9. **"Set your level and goal" was ticked with only one of them set.** Both are needed now.
10. **The same thing in two places:** the current-streak read was written out in Profile, `/api/progress` and the reminder (now one `currentStreak` in `lib/freeze.ts`); the five skills were listed twice (`CRITERIA` now comes from `lib/skillFocus.ts`); the tab names were copied (now read from `DECK_KINDS`); the lowest skill was picked twice (now once in `lib/dashboard.ts`, for both the highlight and the button). The helper `newPerDayOf`, orphaned by the new dashboard, is removed.
11. **The reminder job could run out of time.** The streak line adds a few reads per student; it now stops 15 s before the job's deadline, and the reminders still go out without the line.

Checked again after the fixes, on a fresh local database: every number check (Phase 1 42, Phase 2 13, freezes 20, Phase 4 7, audit 2), every browser suite (79 + 50 + 30 + 24, now including "no header request on a phone or the dashboard"), the export and the dashboard with the freeze tables missing, `tsc`, `next build`; no hard-coded colours in the diff (the reminder email's `#666` is older and emails cannot use the theme tokens), no changed file over 250 lines, a header comment on every new file.

Left as they are, on purpose:
- Card XP also leaves when a card or deck is deleted (its answers go with it). Keeping XP through deletions needs a stored per-day XP table; worth it only if students notice.
- Admin → Content needs the new `Module.focus` column, so it fails in the minutes between a deploy and Database setup. Only the admin is affected, and the admin runs Database setup.
- `studyDates` in `lib/history.ts` was unused before this branch; not this chat's to remove.
- Before this branch, the reminder job already checked its deadline only between pages of 100 students; unchanged.

## Ideas noted, not planned

- (Built in Phase 4: header stats, the reminder line.)

## Not in this round

Teacher home page (Queue stays the teacher's home), admin overview, read-tracking of audits (needed before "read your audit" can earn XP), push notifications, leaderboards.

## Sources

Apps and product writing (what other apps do):
- Duolingo blog, how the streak builds habit: https://blog.duolingo.com/how-duolingo-streak-builds-habit
- Duolingo blog, tips for keeping a streak (freezes, up to two): https://blog.duolingo.com/tips-for-maintaining-streak
- Duolingo blog, Friends Quests: https://blog.duolingo.com/friends-quests/
- Lenny's Newsletter, "Behind the product: Duolingo streaks" (retention PM interview): https://lennysnewsletter.com/p/behind-the-product-duolingo-streaks
- Lazyweb summary of Duolingo retention experiments (secondary, use with care): https://lazyweb.com/research/duolingo-retention-experiments
- Babbel magazine, habit features (streak, two freezes a week): https://babbel.com/en/magazine/build-a-language-habit
- Babbel support, home-screen widget: https://support.babbel.com/hc/en-gb/articles/36299516418962-Babbel-widget
- Busuu blog, Study Plan (goal + days a week): https://blog.busuu.com/new-feature-study-plan-achieve-language-learning-goals/
- Khan Academy help, Learner Home (streak and levels on home): https://support.khanacademy.org/hc/en-us/articles/360030753412
- Speak help centre (streak on Home, streak freeze): https://help.speak.com/de/articles/11645358
- Review Heatmap add-on for Anki (calendar of past and due reviews): https://github.com/glutanimate/review-heatmap
- Skritter docs, home screen (streak, goals, recent decks): https://docs.skritter.com/article/231-home-screen
- Yu-kai Chou, streak design and burnout: https://yukaichou.com/gamification-analysis/streak-design-gamification-motivation-burnout/
- The Decision Lab, "Streak creep" (reports the streak-repair study second-hand): https://thedecisionlab.com/fr-CA/insights/consumer-insights/streak-creep-the-perils-of-too-much-gamification

Peer-reviewed research (found through Consensus, 29 Oct 2026):
- Sailer & Homner (2019), The Gamification of Learning: a Meta-analysis, Educational Psychology Review. doi:10.1007/s10648-019-09498-w
- Huang et al. (2020), The impact of gamification in educational settings on student learning outcomes: a meta-analysis, ETR&D. doi:10.1007/s11423-020-09807-z
- Zhang & Hasim (2023), Gamification in EFL/ESL instruction: a systematic review, Frontiers in Psychology. doi:10.3389/fpsyg.2022.1030790
- Ratinho & Martins (2023), The role of gamified learning strategies in students' motivation in high school and higher education, Heliyon. doi:10.1016/j.heliyon.2023.e19033
- Fleur et al. (2023), IguideME: personalized peer-comparison feedback, Journal of Learning Analytics. doi:10.18608/jla.2023.7853
- Herodotou et al. (2025), Prescriptive analytics motivating distance learning students to take remedial action, LAK '25. doi:10.1145/3706468.3706508
- Bodily et al. (2018), The design, development, and implementation of student-facing learning analytics dashboards, J. Computing in Higher Education. doi:10.1007/s12528-018-9186-0
- Paulsen & Lindsay (2024), Learning analytics dashboards are increasingly becoming about learning, Education and Information Technologies. doi:10.1007/s10639-023-12401-4
- He & Loewen (2022), Stimulating learner engagement in app-based L2 vocabulary self-study: goals and feedback, System. doi:10.1016/j.system.2021.102719
- Van Leeuwen & Van der Schaaf (2025), Students' use of a learning analytics dashboard and influence of reference frames, J. Computer Assisted Learning. doi:10.1111/jcal.70015

# Student dashboard — redesign plan

Status: **PLANNING (design only, nothing built).** Written 29 Oct 2026 on branch `claude/hopeful-heisenberg-04ufep`. This chat works only on the dashboard.

Mockup: `docs/dashboard-mockup.html` (open in a browser; phone and computer, the special states and the two sheets; a Light / dark button checks the tokens). Screenshots: `docs/dashboard-mockup-phone.png`, `docs/dashboard-mockup-desktop.png`, `docs/dashboard-mockup-states.png`, `docs/dashboard-mockup-sheets.png`. The same screens are on a private design canvas for the owner, "EduSarthi student dashboard" (https://claude.ai/artifact/BMBLa2RjthqFGsgwCZokCs), each artboard with a Theme tweak; the repo files are the record.

## Owner's answers (29 Oct 2026)

| Question | Answer |
|---|---|
| Which dashboard? | **Student only** (`/dashboard`). Teacher and admin are not in this round. |
| What comes first? | **Today's work.** Progress and charts go lower or to the Progress page. |
| How much game? | **Medium:** streak, daily goal ring, badges, XP, level, weekly goal, streak freeze. **No leaderboard.** |
| What to deliver now? | **List + design.** Build later, in phases, after approval. |

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

Eight blocks on a phone instead of twelve, each smaller. Blocks with nothing to say are not drawn (no empty boxes).

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
| 9 | **Level and badges** | "Stage 5 · 1,240 XP", a bar to the next stage ("260 XP to Stage 6"), the next badge with its progress ("7-day streak: 2 days to go"), the last three badges earned → Profile. | XP, `badgesFor` | XP new; badges yes |

(Block 1 is the page heading, so the blocks a student scrolls through are 2–9.)

**Moved off the dashboard to Progress / History** (already there): the score trend chart, the rubric first-to-latest table, the seven-day bars, the recent-activity list, the "audits received" count.

### Phone and computer

- **Phone (390 px):** one column in the order above. At 390×844 the Today card and Do this next are fully on the first screen and Today's tasks starts below them, so a student sees what to do without scrolling.
- **Computer (≥1024 px):** two columns. Left (wide): Do this next, Today's tasks, With your teacher, Your skills, Flashcards. Right (320 px): Today card, Level and badges, Notices.

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

## The game rules (proposal, numbers to tune after real use)

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

## Build plan (later, each phase needs approval — every phase touches more than 6 files)

| Phase | What | Schema change? |
|---|---|---|
| **1. New layout with today's data** | Blocks 2 (streak + week dots, no XP yet), 3, 4, 5, 6, 7, 8 in the new order; streak counts cards and recordings; all card kinds and decks in counts; recordings left today; guest and new-student states; charts moved off. | No |
| **2. XP, daily goal, stage, weekly goal** | `lib/xp.ts` (one grouped SQL over `ReviewLog` + `Submission` by India day), the ring, chips, XP sheet, stage bar, two new Settings rows (daily goal, weekly goal) in `User.preferences`. | No |
| **3. Streak freeze, badges, celebrations** | Freeze storage (one small additive table, e.g. `StreakFreeze { userId, day }`, plus a held count), streak sheet with the month calendar, new badges, ring-complete and milestone moments, Help page section. | **Yes, additive** — Database setup once; no existing data touched. |

Files expected (phases 1–2): `app/(student)/dashboard/page.tsx` (rewritten and split: it is near 250 lines now), new `components/dashboard/TodayCard.tsx`, `TodayTasks.tsx`, `TeacherCard.tsx`, `SkillsCard.tsx`, `LevelCard.tsx`, `lib/streak.ts` (replaces the recording-only `streakDays`), `lib/xp.ts`, `lib/dashboardNext.ts`, `lib/badges.ts`, `lib/preferences.ts`, two Settings rows, Help, `docs/FEATURE-MAP.md`. The old `TodayStrip`, `TodayWork`, `LatestAudit`, `InFlightCard`, `RecentHistory` and `WhatToWorkOn` are retired or folded in; `ScoreTrend`, `CriteriaChange` and `WeeklyActivity` stay for the Progress page.

**History limit to know:** `ReviewLog` exists only since 26 Oct 2026 (study history). Card XP and card-based streak days can only be counted from that date; recordings count from the start. The XP sheet should say "XP counts from 26 Oct 2026" rather than invent earlier numbers.

## Open questions for the owner

1. **Name of the XP level:** "Stage" (recommended, because "Level" already means the English level on Profile and the module level on "Next up · Level 2") or "Level"?
2. **Streak minimum:** 10 XP a day (recommended), any single card, or the full daily goal?
3. **Daily goal choices:** 20 / 40 / 60 / 100 XP with 40 as the default — OK?
4. **Weekly goal and freezes:** default 5 days a week; a freeze earned per weekly goal met, at most 2, new accounts start with 1 — OK?
5. **Deck cards earn XP too** (own, shared, followed decks) — recommended yes.
6. **Guests get streak and XP** — recommended yes (gives them a reason to keep their progress).
7. **The score trend chart leaves the dashboard** (it stays on Progress) — OK?

## Ideas noted, not planned

- The header already has an empty `stats` slot (`StickyHeader`, row 2 on a computer; the student layout says "No `stats` yet"). The 🔥 and XP chips could live there so they show on every page, not only the dashboard.
- A "streak at risk" line in the existing daily reminder email.

## Not in this round

Teacher home page (Queue stays the teacher's home), admin overview, a skill tag on modules (needed before "Work on fluency" can open fluency exercises directly), read-tracking of audits (needed before "read your audit" can earn XP), push notifications, leaderboards.

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

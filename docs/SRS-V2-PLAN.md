# Spaced repetition v2 — plan (30 Oct 2026, branch `claude/kind-euler-q35ydg`)

Status: **Approved 30 Oct. All four steps BUILT** (tested on a throwaway local Postgres and in a browser). Not merged. Next: the owner tries it locally, merges, deploys, then runs the restage script (Step 1, Deploy order).
Today's rules (v1) are listed in `docs/srs-review-plan-rules.xlsx` (R01–R28).

## The owner's decisions (30 Oct)

| # | Decision |
|---|---|
| D1 | Once a card is answered (Known or Unknown), it comes back **no sooner than 3 days later** (Monday → Thursday). The ⭐ ❤️ ❓ 💯 remarks and the note still do not schedule anything. |
| D2 | New ladder: **3 · 7 · 15 · 30 · 60 · 120 · 180 days** (Day 1 is gone; 120 and 180 are new). |
| D3 | New card, first Known: Hard → 3 days, Medium → 7, Easy → 15 (Hard +0, Medium +1, Easy +2 steps, as today). |
| D4 | Unknown → **two steps down**, never below 3 days (60 → 15; 7 → 3). |
| D5 | After Unknown, the card is shown **once more in the same session**, a few cards later, as practice. That practice is not saved and does not move its date. |
| D6 | Due by **India-time day**, not exact hours: "in 3 days" means from midnight IST on that day. |
| D7 | **Daily review limit** in Settings. Default **No limit**; options 50 / 100 / 150 / 200. |
| D8 | **Spread** on long gaps so one day's cards do not all come back on one day: 15 days ±1, 30 days and more ±2. |
| D9 | **Late credit:** on Known + Medium / Easy, the next gap is at least as long as the card actually stayed remembered (due 7, came back on day 20, Known → 30). |

## Decisions I took as defaults (say if any is wrong)

- **Late credit not on Hard.** Hard means "I struggled", so it keeps the same gap.
- **Spread is fixed per card, not random.** It is worked out from the card's id and its review count, so the same answer always gives the same date and the tests can check it.
- **The review limit counts built-in cards only**, like the new-card limit. Own and followed decks stay unlimited: the student chose them.
- **Same-session practice works everywhere:** the Flashcards tab, own decks, and library decks.
- **Cards already scheduled keep their date.** A card due "tomorrow" under the old rule stays due tomorrow. This happens once, at the switch.

## Existing data — what changes, what could be lost

Each card stores a step number (`CardState.stage`) that points into the ladder. The ladder loses Day 1, so every stored step must move down by one, or a card on "60 days" would suddenly read as "120 days".

- **One-off script** `scripts/srs-v2-restage.ts`. It works out each card's new step from the gap it was actually given (`dueAt − lastReviewedAt`), matched to the nearest new step: 1 or 3 days → 3, 7 → 7, … 60 → 60.
- It reads the gap rather than doing "step − 1", so **running it twice does no harm**.
- It rewrites `stage` only. `dueAt`, `known`, remarks, notes and history (`ReviewLog`) are not touched.
- **No data is lost. There is no schema change and no migration.**
- Run it once, right after the deploy, against the live database.

## Build order — one step, one commit, each tested before the next

**Step 1 — the rules (`lib/srs.ts`, `app/api/flashcards/route.ts`, new `scripts/srs-v2-restage.ts`, new `scripts/srs-unit.ts`) — BUILT**
- Done: `npx tsx scripts/srs-unit.ts` passes 18 checks. The restage script was run on a throwaway local Postgres seeded with v1 and v2 cards: 1/3 → 3, 7 → 7, … 60 → 60, v2 cards and remark-only cards untouched, a second `--apply` changed 0 rows. Help page and schema comment now name the new ladder. `ReviewLog.stage` keeps old numbers for old answers; nothing reads it.
- **Deploy order:** (since the second audit, first `npx prisma db push` for `CardState.firstReviewedAt`, see below) deploy, then straight away `npx tsx --env-file=.env scripts/srs-v2-restage.ts` (dry run), check the counts, then `--apply`. Since the audit fix A2, answering reads a card's rung from its gap, so a late run no longer moves any card wrongly; until it runs, only the Review Plan box shows old cards one rung too high.
- New ladder, Unknown two steps down, the 3-day floor, IST-day due dates, spread, late credit.
- "Next review …" text counts India-time days.
- `srs-unit.ts` checks every rule above with fixed dates (no database).

**Step 2 — daily review limit (`lib/preferences.ts`, `app/(shared)/settings/SettingsSections.tsx`, `lib/flashcards.ts`, `lib/todayReview.ts`, `app/(student)/flashcards/page.tsx`, `components/flashcards/DeckMessages.tsx`) — BUILT**
- Done: Settings → Reviews per day (No limit / 50 / 100 / 150 / 200), saved as `reviewsPerDay` (0 = no limit). Counted per kind (Words, Chunks, Grammar, Support) per India day, like new cards. A review = a card answered today that was first answered before today. Past the limit, due cards wait and new cards are still served; the Done card says how many wait and its button "Keep going anyway" (`?more=1`) lifts both limits. Due counts on the Flashcard tab, Today page and Dashboard stop at the limit. Own and followed decks are not limited.
- Tested: `nextCardId`, `deckCounts` and `todayReview` against a local Postgres (limit 5 with 3 done → 2 served, 3 held back; limit used → a new card; `more=1` → due again; no limit → as before). Not tried in a browser: the Settings row and the Done card's wording.
- New setting `reviewsPerDay` (null = no limit).
- Reviews done today are counted from `ReviewLog` by India day.
- When the limit is reached, the "Done for today" card says so and offers "Review more anyway", just as new cards do today.

**Step 3 — same-session practice (new `lib/cardAgain.ts`, `FlashcardDeck.tsx`, `DeckStudy.tsx`, the three study pages) — BUILT**
- Done: after Unknown the card's code goes into `?again=CODE~3`; each card left (answered or ›) counts one down; at 0 the session page shows it once with a "Practice · not saved" line above the card (`components/flashcards/PracticeNotice.tsx`). On that look Known, Unknown and › only move on: nothing is posted, the date Unknown set stays, and it is not queued again. If nothing else is left, a waiting practice card comes at once rather than never. Off inside "Study this list" sessions. Works on the Flashcards tab, own decks and library decks (`pickWithAgain` in each page).
- Tested: `scripts/srs-unit.ts` (22 checks, 4 for the again list). Browser, production build, local Postgres, phone width: Unknown on card 1 → URL `again=TST-001~3`; three Known → card 1 again with the practice line; Known → next new card, `again` gone, card 1 still `reviews = 1`; Known on a new card → due in 7 IST days; side 3 shows Day 3 … Day 180; Settings → Reviews per day → 50 saved; with 50 reviews done and 10 due the Done card says "10 more cards are due; they will wait for tomorrow", top bar 0 due, Keep going serves a due card; no page errors. **Not clicked through in a browser:** own-deck and library-deck sessions (same code path, typechecked).
- Seen, not changed: a long word on the front ("ABANDON" at 390 px) breaks over two lines; that is the existing fit-to-screen text, same with or without the practice line.
- After Unknown, the card's code goes into an `again` list in the page link, the same way skips work.
- After 3 more cards it is shown once with a "Practice — not saved" label. Its buttons just move on and save nothing.

**Step 4 — words and docs — BUILT**
- Done: `docs/srs-review-plan-rules.xlsx` is v2.0 (R01–R32, column B marks NEW / CHANGED, simulator on the v2 ladder with Unknown = two steps down; recalculated, 0 formula errors, its run matches the v2 rules). `docs/PROJECT-MEMORY.md` has the v2 section. The store listing only says "spaced repetition", so it needed no change.
- Review Plan box: the ladder is read from `LADDER_DAYS`, so it shows the 7 new steps on its own.
- Update the Excel sheet to v2, `docs/PROJECT-MEMORY.md`, and the store listing line if it is affected.

About 15 files across 4 steps.

## Testing honestly

- Steps 1–3: `npm run typecheck`, `npm run lint`, and `scripts/srs-unit.ts` run in the cloud session.
- There is **no database in the cloud session**. The pages, the Settings row and the restage script must be tried on the owner's local database before merging. A checklist will be added here after Step 3.

## Deck sessions in a browser (30 Oct) — PASSED

Own deck and followed library deck, production build, local Postgres, 390 px: 29 checks. Unknown → `again=OWN-1~3`, saved once, due in 3 IST days; three cards later the same card with "Practice · not saved"; its answer not saved; then the next new card with `again` gone; a new card's Known → 7 days; at the end of a session the waiting practice card comes at once, and a practice Unknown does not queue it again ("Done for now"); side 3 shows ✓ Day 3, Day 7 · next … Day 180, "Next review in 7 days"; no page errors.

## Audit of v2 (30 Oct) — A1–A9 FIXED (owner: "do the best for this project"); A10 left

**What was fixed and how it was checked:**
- A1: `lib/flashcards.ts` `answeredToday` and the SQL in `lib/todayReview.ts` tell new from review by the answer count (`reviews = 1` new, `> 1` review) among cards answered today. This also fixes the same mistake in the **new-card limit**, which existed before v2 (owner chose to fix both). `lib/xp.ts` still uses `createdAt` on purpose (its own comment explains it; history is per past day). Known edge: a new card answered twice in one day by opening it again counts its second answer as a review.
- A2: `lib/srs.ts` `rungForGap` + `RUNG_BANDS`; `nextReview` reads the current rung from `dueAt − lastReviewedAt` when both exist. The restage script builds its SQL from the same `RUNG_BANDS`.
- A3: the dry run prints how many answered cards have no `lastReviewedAt` (0 expected).
- A4: `deckCounts` returns `reviewsLeft`; the page passes it to `nextCardId`, so one count per page load.
- A5: `findInDeck(deck, code)` looks the practice card up inside the session's filter.
- A6: `pickWithAgain` drops codes it cannot find.
- A7: `lib/flashcards.ts` and `lib/todayReview.ts` use `lib/srs` `istDayStart` (`lib/aiLimits.ts` left alone).
- A8: `reviewsPerDay` schema is built from `REVIEWS_PER_DAY_OPTIONS`.
- A9: `pickForSession` in `lib/cardAgain.ts` used by all three study pages.
- Checked: `scripts/srs-unit.ts` 26 checks (4 new: v1 and v2 gaps map to the right rung, a v1 card answered before the restage keeps its rung, dead practice codes dropped, the page helper). Local Postgres: tagged-yesterday-answered-today counts as new, reviews counted only for real reviews, the review limit passed in or counted inside gives the same card, the practice lookup refuses a card outside the filter, the restage dry run with the shared bands. Production build, both browser suites again (Flashcards tab 17 checks, decks 29 checks): all pass.

**The findings as reported:**

Code review of `main...claude/kind-euler-q35ydg`. Ranked; "real" means it can happen in normal use.

| # | Finding | Real? | Proposed fix |
|---|---|---|---|
| A1 | A card remarked (⭐ etc.) on an earlier day and answered for the first time today counts as a **review**, not a new card, because "new today" / "review today" are told apart by `CardState.createdAt`, which a remark also sets. Uses up the review limit for nothing. | Yes, with a review limit set | Tell them apart by the answer count: review today = answered today and `reviews ≥ 2`; new today = answered today and `reviews = 1`. The same `createdAt` problem already existed for the **new-card** limit (before v2); fixing that too is a separate owner decision. |
| A2 | Between the deploy and the restage script, an answer on an old card reads its stored step on the new ladder and lands one rung too high (old 60 → 180), and the script cannot undo it. | Yes, if the script runs late | Work the current step out from the card's real gap (`dueAt − lastReviewedAt`, the same rule the script uses) when answering, not from the stored number. Then the order of deploy and script no longer matters; the script only fixes what the box shows. |
| A3 | The restage script skips answered cards with no `lastReviewedAt`. | No: every answer since 29 Sep sets both, and guest merge moves rows whole | Count them in the dry run anyway, so the owner sees 0. |
| A4 | With a review limit, each Flashcards page load counts today's reviews twice, one after the other. | Slower on the one-connection pool | Count once and run it alongside the due-card query. |
| A5 | Practice card lookup on the Flashcards tab ignores the tab's filter (type, channel, level, section, pack). | Only via an edited or old link | Look it up inside the same filter as the session. |
| A6 | `pickWithAgain` keeps codes it could not find when nothing else is left. | Only for a deleted card | Drop them. |
| A7 | Three copies of "IST midnight" (`lib/srs`, `lib/flashcards`, `lib/aiLimits`). | Tidy-up | `lib/flashcards` and `lib/todayReview` use `lib/srs`'s; `lib/aiLimits` left as is. |
| A8 | `reviewsPerDay` values written twice (schema and options list). | Tidy-up | Build the schema from the list. |
| A9 | The again/practice wiring is copied in three study pages. | Tidy-up | One helper in `lib/cardAgain`. |
| A10 | `FlashcardDeck.tsx` is 256 lines (rule: ~250). | Known, noted in PROJECT-MEMORY | Not in this fix; split only if the owner asks. |

Files the fixes would touch: `lib/srs.ts`, `lib/flashcards.ts`, `lib/todayReview.ts`, `lib/preferences.ts`, `lib/cardAgain.ts`, `scripts/srs-v2-restage.ts`, `scripts/srs-unit.ts`, the three study pages — 10 files, so the owner approves first (CLAUDE.md).

## Second audit (30 Oct) — only this chat's work (`398f702..d14a92d`), after the A1–A9 fixes — B1–B8 FIXED

**What was fixed and how it was checked:**
- B1: new column `CardState.firstReviewedAt` (nullable; set once by the first Known / Unknown in `app/api/flashcards/route.ts`; null = first answered before the column existed = old; included in the data download). New today = `firstReviewedAt` today; review today = answered today and `firstReviewedAt` earlier or null. `lib/flashcards.ts` `answeredToday`, `lib/todayReview.ts` `reviewedTodaySql`. No backfill needed. **Schema change: run `npx prisma db push` on the live database before deploying the code** (nothing is deleted).
- B2: `servableDue` in `lib/srs.ts` is the one capping rule; `lib/studyReminders.ts` counts per kind with today's reviews and caps by the student's limit. Checked on a local database through `sendStudyReminders`: limit 50 with 50 done → no email; 45 done → "5 flashcards are due"; no limit → 10.
- B3: practice line now "Cards you mark Unknown come round once more like this. Known or Unknown here only moves on; this card's review date does not change." (always true).
- B4: `deckCounts` returns `today: { reviewsLeft, newLeft }`; `nextCardId(userId, deck, { extra, skip, newPerDay, reviewsPerDay, today })` uses it, so one page load counts once.
- B5, B6: `find` in `pickWithAgain` / `pickForSession` takes all codes at once and returns the card rows; the pages use the row and skip the second fetch.
- B7: navigation for FlashcardDeck and DeckStudy is one hook, `components/flashcards/useCardNav.ts`; FlashcardDeck 232 lines.
- B8: `lib/aiLimits.ts` re-exports `istDayStart` from `lib/srs.ts`.
- Checked: typecheck; `scripts/srs-unit.ts` 26 checks (picker tests now also check one lookup for ten codes and the returned row); local Postgres checks of new/review counting, limits, lookups and the reminder; production build; browser suites `scripts/srs-e2e/` (now in the repo) both pass.

## What this chat set out to build — checked 30 Oct

| Asked | Where | State |
|---|---|---|
| Explain the Review Plan box | chat answer | Done |
| Rules in an Excel file for changes | `docs/srs-review-plan-rules.xlsx` | Done, v2.1 matches the code |
| Is it the best? | chat answer | Done |
| Build the suggestions + "minimum 3rd day" (D1–D9) | Steps 1–4 above | Done |
| Browser test of decks, audit, fixes | sections above | Done |
| Second audit of only this chat, fix all | this section | Done |
| Left over and built in this round | Help FAQ now names both daily limits and the practice look; deploy order with `db push` written down; browser suites kept in `scripts/srs-e2e/`; Excel v2.1 | Done |
| Owner's steps, not code | `npx prisma db push` on live, deploy, restage script (dry run, then `--apply`), merge | Waiting for the owner |

**The second audit's findings as reported:**

| # | Finding | How real | Fix idea |
|---|---|---|---|
| B1 | Opening a card again with ‹ (or `?card=`) on its first day and answering it makes `reviews = 2`, so it moves from "new today" to "review today": the student gets one extra new card past the limit and loses one review slot. Same in Today/Dashboard counts. | Real: ‹ then Known is normal use. Was noted as a known edge of A1; the audit shows its cost. | Store the first-answer time (`CardState.firstReviewedAt`, one new nullable column, filled from `createdAt` for answered cards; no data lost) and count by it. Needs a schema change, so the owner decides. |
| B2 | The daily reminder email counts every due card and ignores Reviews per day. | Real with a limit set: the email can say 250 due when the app shows 0. | Cap it the same way, ideally one shared "reviews left today" helper. |
| B3 | The practice line says "You marked this Unknown a few cards ago", but at the end of a session the card comes back at once, and an old or edited link can show it for a card never marked Unknown. | Copy not always true (CLAUDE.md rule 15). | Wording that is always true, e.g. "Once more: a card you marked Unknown." |
| B4 | `nextCardId` still counts today's new cards again after `deckCounts` did. | Extra round trip when no due card is served. | Pass `newLeft` in like `reviewsLeft`. |
| B5 | The end-of-session fallback looks up waiting practice codes one at a time (up to 10). | Only with stale codes. | One `findMany` for all codes. |
| B6 | Deck pages fetch a practice card twice (code → id, then id → card). | One extra query per practice look on decks. | Return the row from `find`. |
| B7 | `FlashcardDeck.tsx` 256 lines (= A10). | Rule 11. | Shared `useAgainNav` hook for FlashcardDeck and DeckStudy. |
| B8 | Two `istDayStart` (lib/srs and lib/aiLimits). | Tidy-up. | `lib/aiLimits` re-exports lib/srs's. |

## Third audit (30 Oct) — this chat's work (`398f702..cb7a890`), after the B1–B8 fixes. Not fixed yet

| # | Finding | How real | Fix idea |
|---|---|---|---|
| C1 | Unknown on the **last** card of a session brings the same card back at once as practice with the same React key, so the card keeps the side it was on (often the answer side) and the recall attempt is lost. | Real at every session end with an Unknown | Put `practice` in the card's `key` on the three pages. |
| C2 | Deploying the code before `npx prisma db push` breaks answers and the flashcard pages (missing column). | Known; deploy order is written in PROJECT-MEMORY | Keep the order; optionally say it in the PR. |
| C3 | On deploy day, cards first answered earlier that day have `firstReviewedAt` null and count as reviews, not new: up to one extra day's new cards. | One day only | Treat null as before: new if `createdAt` is today. |
| C4 | Known, then ‹ and Unknown within 8 s: the server ignores the second answer (double-tap guard) but the page still queues a practice look for an Unknown that was not saved. | Rare | The API says when it ignored an answer; queue only when saved. |
| C5 | Help says "never in less than 3 days", but due dates are India midnights: Unknown at 11:50 pm Monday is due from Thursday 00:00, about 2 days later. The owner's rule was "Monday → Thursday" (calendar days). | Copy not exact (rule 15) | Say "not before the third day after (Monday → Thursday)". |
| C6 | Two practice cards ready at once and the first is gone: the second waits one extra card. | Rare | Look all ready codes up together. |
| C7 | The deck pages each write their own practice lookup. | Tidy-up | One helper in `lib/decks`. |
| C8 | `servableDue(Infinity, …)` used to mean "reviews left". | Tidy-up | Write `Math.max(0, limit − done)`. |
| C9 | Reminder groups rows per student by scanning the list. | Small now | Group into a Map once. |
| C10 | `scripts/srs-unit.ts` is 264 lines (rule 11). | Rule | Split into srs and cardAgain checks. |

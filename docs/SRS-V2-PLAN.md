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
- **Deploy order:** deploy, then straight away `npx tsx --env-file=.env scripts/srs-v2-restage.ts` (dry run), check the counts, then `--apply`. Until it runs, a card on old "60 days" would be treated as the 120-day rung on its next answer.
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

## Audit of v2 (30 Oct) — findings, fixes waiting for the owner's approval

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

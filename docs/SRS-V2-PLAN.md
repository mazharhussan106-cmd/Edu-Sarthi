# Spaced repetition v2 — plan (30 Oct 2026, branch `claude/kind-euler-q35ydg`)

Status: **PLANNED, waiting for the owner's approval.** Nothing below is built yet.
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

**Step 1 — the rules (`lib/srs.ts`, `app/api/flashcards/route.ts`, new `scripts/srs-v2-restage.ts`, new `scripts/srs-unit.ts`)**
- New ladder, Unknown two steps down, the 3-day floor, IST-day due dates, spread, late credit.
- "Next review …" text counts India-time days.
- `srs-unit.ts` checks every rule above with fixed dates (no database).

**Step 2 — daily review limit (`lib/preferences.ts`, `app/(shared)/settings/SettingsSections.tsx`, `lib/flashcards.ts`, `lib/todayReview.ts`, `app/(student)/flashcards/page.tsx`, `components/flashcards/DeckMessages.tsx`)**
- New setting `reviewsPerDay` (null = no limit).
- Reviews done today are counted from `ReviewLog` by India day.
- When the limit is reached, the "Done for today" card says so and offers "Review more anyway", just as new cards do today.

**Step 3 — same-session practice (new `lib/cardAgain.ts`, `FlashcardDeck.tsx`, `DeckStudy.tsx`, the three study pages)**
- After Unknown, the card's code goes into an `again` list in the page link, the same way skips work.
- After 3 more cards it is shown once with a "Practice — not saved" label. Its buttons just move on and save nothing.

**Step 4 — words and docs**
- Review Plan box: the ladder is read from `LADDER_DAYS`, so it shows the 7 new steps on its own.
- Update the Excel sheet to v2, `docs/PROJECT-MEMORY.md`, and the store listing line if it is affected.

About 15 files across 4 steps.

## Testing honestly

- Steps 1–3: `npm run typecheck`, `npm run lint`, and `scripts/srs-unit.ts` run in the cloud session.
- There is **no database in the cloud session**. The pages, the Settings row and the restage script must be tried on the owner's local database before merging. A checklist will be added here after Step 3.

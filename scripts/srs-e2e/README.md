# Spaced repetition tests

Checks for spaced repetition v2 (`docs/SRS-V2-PLAN.md`).

| Suite | What it checks |
|---|---|
| `flashcards` | Flashcards tab at phone width. Unknown → due in 3 India days and `?again=…~3`. Three cards later the same card comes back with "Practice · not saved", and its answer is not saved. A new card's Known → 7 days, and `firstReviewedAt` is set. Side 3 shows Day 3 … Day 180 and no Day 1. Answering a new card again the same day still counts it once as new. Settings → Reviews per day → 50 is saved. With 50 reviews done and 10 due, the Done card says 10 wait for tomorrow, and "Keep going anyway" serves a due card. No page errors. |
| `decks` | The same practice flow on the student's own deck and on a followed library deck. At the end of a session, a waiting practice card comes at once, and a practice Unknown does not queue it again. Side 3 of a deck card shows ✓ Day 3, Day 7 · next … Day 180. No page errors. |
| `../srs-unit.ts` | Pure rules, no app needed: the ladder, the 3-day floor, Unknown −2, late credit, spread, IST days, reading a card's rung from its gap, the practice list and the session picker. |

**Local only.** `seed.cjs` deletes and remakes only rows whose code starts with `SRS-` and the accounts `srs-student@test.local` and `srs-author@test.local`. It refuses to run unless `DATABASE_URL` points at a localhost database. `psql` must be installed.

## Run

1. Set up `.env` and the tables as in `scripts/library-e2e/README.md`, step 1:

```bash
npx prisma db push
```

2. Build the production app:

```bash
npm run build
```

3. Start it, and leave it running:

```bash
npm run start
```

4. In another terminal, run both suites (each one reseeds first), or name one (`flashcards` or `decks`):

```bash
NODE_PATH="$(npm root -g)" node scripts/srs-e2e/run.cjs
```

5. Run the pure rules; this needs no app:

```bash
npx tsx scripts/srs-unit.ts
```

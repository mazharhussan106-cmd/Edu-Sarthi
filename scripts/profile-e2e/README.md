# Profile browser tests

Playwright checks for the Profile page (student, guest, teacher, admin), one suite per build phase in `docs/PROFILE-PLAN.md`:

| Suite | What it checks |
|---|---|
| `p1-layout` | Identity card, Edit profile (name, number), goal sheet, badges, Who sees what, delete account, `#your-data`, the same streak on Profile, dashboard and header, Get started opening the goal sheet, axe |
| `p2-scores-calendar` | Speaking scores, practice calendar (learning days by the dashboard's XP rule, a freeze day, weeks per width, list sheet, empty states), axe |
| `p3-goal-date` | Target date: days left, reload, server refusals, today, a passed date, clear, axe |
| `p4-staff` | Teacher and admin profiles, QA notes with their audit, queue and turnaround equal to Queue and Workload, admin's QA-note warning, axe |
| `p5-photo` | Photo: wrong file, keyboard crop and focus, stored file is 512 × 512 WebP with no camera data, replace, export, refused keys and oversized files, guests, no leak to teacher or admin pages, remove, account deletion |
| `p6-share-badges` | 17 badges, Share progress preview, switches and 1080 × 1350 PNG download, axe |

**Local only.** `seed.cjs` deletes and remakes seven `@test.local` accounts with one known password, and it refuses to run unless `DATABASE_URL` is a localhost database.

## Run

1. Start a local Postgres and put its URL in `.env` as `DATABASE_URL` (and `DIRECT_URL`).
   - Leave `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` out of `.env`, so photos go to `.dev-uploads/` (`lib/storage.ts`).
   - Also set `AUTH_SECRET` and `AUTH_TRUST_HOST=true`.
2. Create the tables:

```bash
npx prisma db push
```

3. Start the app:

```bash
npm run dev
```

4. axe-core is not a project dependency; add it without saving:

```bash
npm i --no-save axe-core@4.10.3
```

5. Run every suite (each one reseeds first), or name some (`p1 p4`):

```bash
NODE_PATH="$(npm root -g)" node scripts/profile-e2e/run.cjs
```

`NODE_PATH` lets the scripts find a globally installed Playwright; cloud sessions have one with Chromium. Elsewhere, install Playwright and its Chromium yourself.

## Known, not counted as failures

On every page of the app, axe reports the logotype's contrast and the header's two unlabelled navs (`docs/PROJECT-MEMORY.md`, Settings phase M). `lib.cjs` leaves those two out.

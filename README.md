# Edusarthi

Spoken English practice with a written audit from a teacher — five rubric
scores, a summary, and notes pinned to timestamps.

**Status: written but never run.** No dependency has been installed, no
migration applied, no page rendered. Expect the first `npm run dev` to surface
errors.

## First run

Each command on its own. PowerShell.

```powershell
npm install
```

```powershell
npm i -D tsx
```

Create the Supabase project, then put these in `.env` (not `.env.local`):

```env
DATABASE_URL="postgresql://postgres.REF:PASS@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.REF:PASS@aws-0-REGION.pooler.supabase.com:5432/postgres"
AUTH_SECRET="generate with: npx auth secret"
AUTH_TRUST_HOST=true
SUPABASE_URL="https://REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="the service_role key, not anon"
SENDGRID_API_KEY=""
EMAIL_FROM="noreply@edusarthi.com"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SMS_ENABLED=false
```

Create the storage bucket in the Supabase dashboard:

- Name `submissions`
- **Public: OFF**
- File size limit `100MB`
- Allowed MIME types: the keys listed in `ALLOWED_TYPES` in `lib/storage.ts`

Set the size and type limits **on the bucket**. A signed upload URL carries no
constraints of its own, so the bucket is the only real enforcement.

```powershell
npx prisma db push
```

**Upgrading a database that already has users** from the Rose/Ocean themes:
run the one-off script first, then push. Rose users move to Sepia, Ocean users
to Light; nothing else changes.

```powershell
npx prisma db execute --file prisma/migrate-themes.sql --schema prisma/schema.prisma
```

```powershell
npx prisma db push --accept-data-loss
```

Add to `package.json`, alongside `"scripts"`:

```json
"prisma": { "seed": "tsx prisma/seed.ts" }
```

```powershell
npm run dev
```

Then in the browser: register an account. With no SendGrid key the verification
code prints to the terminal running `npm run dev`. Verify, then:

```powershell
npx prisma db seed
```

Put a short `sample.mp3` in `public/` first — the seed creates one demo
submission pointing at it, so the review flow can be tested before any upload.

To test the teacher side: open the `User` table in Supabase, change your `role`
to `TEACHER`, then **sign out and back in**. The role lives in the JWT, so the
old token still says student until a new one is issued.

## Running without Supabase (development only)

Leave `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` out of `.env` and uploads
go to `.dev-uploads/` on disk, served by `/api/dev-storage`. This never
switches on in production. With no `SENDGRID_API_KEY`, sign-in codes and links
print to the terminal running `npm run dev`.

## Sign-in

Students sign in with a six-digit code or a one-tap link sent to their email.
The first successful code creates the account. Password sign-in still works
for accounts registered with one. SMS OTP is not built yet.

## After pulling this schema change

`User.publicId` (the anonymized ID teachers see) is new. Existing rows get one
with:

```powershell
npx tsx prisma/backfill-public-ids.ts
```

## Flashcards

2,227 WordMaster words live in `content/wordmaster-2000/words.json`. Load or
update them (safe to re-run; students' progress is kept):

```powershell
npx tsx prisma/import-words.ts
```

If the Excel changes, regenerate the JSON first:

```powershell
python content/wordmaster-2000/tools/export_json.py
```

1,430 chunks (Core 220, sentence and preposition frames, collocations,
utterances, polywords) live in `content/chunk-library/chunks.json`, built from
`Chunk_Library_Master.xlsx`. Load or update them the same way:

```powershell
npx tsx prisma/import-chunks.ts
```

If the chunk Excel changes, regenerate the JSON first (needs `pip install openpyxl`):

```powershell
python content/chunk-library/tools/export_json.py
```

The workbook's `PRP-xxx` (preposition frames) are imported as `PFR-xxx`,
because the word list already uses `PRP-001…077`. Devanagari Hindi and the
Core 220 gap-fills in `tools/` are Claude's drafts; the card marks them as not
yet checked by a teacher.

## Admin

The first admin is made by hand, once: set `role` to `ADMIN` on your own row in
the `User` table, then sign out and back in. After that, admins change roles
from **Admin → Users**, and every change is written to the admin log
(**Admin → Compliance**).

Admin pages: Overview, Dispatch (reassign, force-unlock, QA flags), Content
(modules, exercises, CSV import), Users (roles, suspension), Compliance
(retention purge, student data requests, admin log). Billing and credits are
not built; they arrive with payments.

## Layout

```
app/(auth)       login, register, verify, password reset
app/(student)    dashboard, modules, practice, feedback
app/(teacher)    queue, review, students
app/(shared)     settings, profile
app/(public)     about, support, legal
app/api          auth, register, upload-url, submissions, feedback, profile
components/ui    Button Card Input Badge Switch SegmentedControl PasswordInput
components/media Recorder Uploader Player SubmitPanel
components/review RubricForm NoteList AuditPlayback
lib              auth prisma storage media theme validations verification email
```

## Known gaps

- No upload progress bar. `fetch` gives no progress events on a PUT body; that
  needs `XMLHttpRequest`.
- No storage `head` check before creating a Submission row, so a client that
  skips the upload can create a row with a dead key.
- No release-claim action. A submission whose file is missing stays `IN_REVIEW`
  and no teacher can clear it.
- No draft autosave in `RubricForm`. Closing the tab mid-audit loses it.
- JWTs stay valid after a password reset. Fixing it needs a `passwordChangedAt`
  column compared in the `jwt` callback.
- `LoginAttempt` rows accumulate with no cleanup job.
- Legal pages are drafts written from the codebase. They need a lawyer.

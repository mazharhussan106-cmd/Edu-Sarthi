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

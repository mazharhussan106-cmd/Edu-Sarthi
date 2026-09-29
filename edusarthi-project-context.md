# Edusarthi — Project Context

Written 27 August 2026, mid-build. This is the accurate current state, not the
original plan — several things changed along the way, and this document says
what actually happened and why.

---

## 1. What Edusarthi is

An English spoken-communication training platform. Students record or upload
spoken English — audio, video, or a photo of written work — against a specific
exercise. A teacher reviews the submission and returns a written audit: five
rubric scores (pronunciation, grammar, fluency, vocabulary, confidence, each
0–10), a written summary, and notes pinned to exact timestamps in the
recording. Two roles, one site, separate interfaces once signed in.

Modelled on **TypeSarthi** (typingsarthi.com), an existing production app by
the same builder — same stack, same engineering standards, new niche and new
visual identity (originally saffron/pink, now a six-theme system).

**Core loop, in order:** student picks an exercise → records or uploads →
submission sits `PENDING` → a teacher claims it (`IN_REVIEW`) → teacher scores
it and writes notes → `REVIEWED` → student reads the audit, can seek to any
note's timestamp in the original recording.

---

## 2. Stack, as actually built

| Layer | Choice |
|---|---|
| Framework | Next.js 16, App Router, Turbopack |
| Language | TypeScript, strict mode |
| Styling | Tailwind v4, CSS-variable token system, 6 themes |
| ORM | Prisma 6.19.3 (pinned — npm initially resolved a mismatched 8.0.0-rc) |
| Database | PostgreSQL on Supabase (Singapore region, `ap-southeast-1`) |
| Auth | Auth.js v5, JWT sessions, Credentials provider only |
| Media storage | Supabase Storage, private bucket `submissions`, signed URLs |
| Email | SendGrid — not yet configured; dev mode logs to console instead |
| Deploy target | Vercel via GitHub — **not yet deployed** |

---

## 3. Decisions made during the build that deviate from the original brief

Worth knowing *why*, so nobody "fixes" these back to the original later.

1. **`--color-pink` → `--color-accent`.** A sixth theme (Ocean) needed a blue
   accent; a token named after one theme's hue would have misled whoever
   touched it next.
2. **Light theme accent is `#dc2087`, not the brief's `#e0218a`.** White text
   on the brief's value measures 4.42:1 — fails WCAG AA for text under 18pt,
   which is every button in the app. `#dc2087` measures 4.57:1.
3. **Ocean theme added**, accent `#007cb2` — not HP's literal `#0096D6`, which
   fails contrast at 3.32:1. Named "Ocean," not "HP," to avoid using another
   company's trademark in a shipped product.
4. **`lib/auth.config.ts` split from `lib/auth.ts`.** Middleware runs on the
   Edge runtime, which cannot load Prisma or bcrypt. The config file holds
   only the Edge-safe callbacks; the full provider setup lives in `auth.ts`,
   imported by Node routes only.
5. **Registration never accepts a role from the client.** Teachers are made by
   hand-editing the `role` column in Supabase. A client-supplied role would let
   anyone sign up as a teacher and read every student's submissions.
6. **`Submission.claimedById` / `claimedAt` added** — not in the original
   schema. Without them, two teachers can open the same `PENDING` submission
   and both write an audit; the second `Feedback` insert fails on the unique
   constraint *after* the teacher has already typed it. Fixed with a
   conditional `updateMany` that only one caller can win.
7. **`VerificationCode`, `PasswordResetToken`, `LoginAttempt`, and the Auth.js
   adapter tables were invented**, not ported from TypeSarthi. The brief
   referenced them without defining them, and TypeSarthi's repo was never
   actually compared against — that verification step never happened.
8. **Login throttle is database-backed**, not an in-memory Map. Serverless
   resets memory on every cold start; a Map-based throttle would silently do
   nothing in production while appearing to work on localhost.
9. **Storage is Supabase, not Vercel Blob.** Keeps everything in one vendor.
10. **Two real bugs found and fixed during setup, worth knowing about:**
    - Middleware's route matcher originally excluded only `/api/auth`, so it
      intercepted the signed-out `POST /api/register` call and redirected it
      to `/login` — the browser got HTML where it expected JSON, surfacing as
      "Something went wrong" with no real explanation. Fixed by excluding all
      of `/api` from the matcher (every route handler checks its own auth
      anyway).
    - The NextAuth route handler re-exported bare `GET`/`POST`, which
      `lib/auth.ts` doesn't export (it exports `handlers`). Would have broken
      every sign-in. Fixed to `export const { GET, POST } = handlers`.
    - The JWT type augmentation only touched `next-auth/jwt`, but in Auth.js
      v5 the real `JWT` interface lives in `@auth/core/jwt` and is merely
      re-exported — augmenting only the re-export left `token.role` reading as
      `unknown` at compile time. Fixed by augmenting both modules.
11. **Enrollment was actually wired up**, not just left as an unused table.
    Enrolling is an explicit button press, not automatic on browsing — a
    student can view or even submit into a module without enrolling, since
    the brief is explicit that browsing must never be gated. Enrollment only
    changes what shows on the dashboard.
12. **The header's second row was written but never connected.**
    `StickyHeader` always accepted a `stats` prop; no layout ever passed one,
    so the row TypeSarthi is known for never rendered. Fixed with
    `StudentStats` / `TeacherStats` server components passed in from each
    layout.
13. **All three settings toggles were decorative until fixed.** They saved to
    the database but nothing ever read the values back:
    - **Larger text** — new `lib/textSize.ts`, a cookie read in the root
      layout (same pattern as theme), scales root `font-size` so every
      Tailwind `text-*` utility follows proportionally.
    - **Autoplay on open** — `Player` gained an `autoPlay` prop; the feedback
      page reads the student's preference server-side and passes it down.
    - **Email on audit** — new `sendAuditReadyEmail` in `lib/email.ts`; the
      feedback-submission route checks the student's preference after saving
      the audit and sends (or in dev, logs) the notification.

---

## 4. File map

```
edusarthi/
├─ package.json, tsconfig.json, next.config.ts, postcss.config.mjs
├─ .gitignore, .env.example
├─ middleware.ts
├─ README.md, DEPLOY.md, CLAUDE.md
│
├─ prisma/
│  ├─ schema.prisma          12 models — see §5
│  └─ seed.ts                3 modules, 6 exercises, 1 demo submission
│
├─ app/
│  ├─ layout.tsx              fonts, theme + text-size cookies read here
│  ├─ page.tsx                landing page, no testimonials/stats (no real data yet)
│  ├─ globals.css             24 tokens × 6 themes
│  │
│  ├─ (auth)/                 login, register, verify, forgot/reset password
│  ├─ (student)/              dashboard, modules, modules/[id], practice/[id],
│  │                          feedback, feedback/[id]
│  ├─ (teacher)/              queue, review/[id], students
│  ├─ (shared)/               settings (+ SettingsForm), profile
│  ├─ (public)/               about, support, legal/privacy, legal/terms
│  │
│  └─ api/
│     ├─ auth/[...nextauth], auth/verify, auth/forgot-password, auth/reset-password
│     ├─ register
│     ├─ profile/theme, profile/preferences
│     ├─ feedback                    claim + submit, race-safe
│     ├─ upload-url, submissions     direct-to-storage upload flow
│     └─ enrollments
│
├─ lib/
│  ├─ utils.ts, prisma.ts, theme.ts, textSize.ts, preferences.ts
│  ├─ validations.ts          every Zod schema, client + server
│  ├─ verification.ts, loginRateLimit.ts, email.ts
│  ├─ auth.config.ts (Edge)   auth.ts (Node)
│  ├─ storage.ts              signed upload/read, service-role key
│  └─ media.ts                duration reading, Safari codec selection
│
├─ types/next-auth.d.ts       role + emailVerified on Session and JWT
│
└─ components/
   ├─ ui/           Button, Card, Input, Badge, Switch, SegmentedControl, PasswordInput
   ├─ layout/       StickyHeader, NavLinks, MobileMenu, SettingsMenu, Footer,
   │                StudentStats, TeacherStats
   ├─ media/        Uploader, Recorder, Player, SubmitPanel
   ├─ review/       RubricForm, NoteList, AuditPlayback
   ├─ student/      EnrollButton
   └─ dashboard/    ScoreTrend
```

Roughly 85–90 files. Every file carries a header comment stating what it owns
and what it deliberately does not.

---

## 5. Domain model (as pushed to the database)

```
User          — role (STUDENT/TEACHER/ADMIN), theme, preferences (Json)
Module        — level, title, description
Exercise      — belongs to a Module; expects AUDIO/VIDEO/IMAGE
Submission    — belongs to a student + exercise; status PENDING → IN_REVIEW
                → REVIEWED (or RETURNED — see gap below); claimedById/claimedAt
Feedback      — one-to-one with Submission; 5 int scores, summary, notes (Json)
Enrollment    — student × module, unique pair; drives "your modules" on dashboard
VerificationCode, PasswordResetToken, LoginAttempt   — auth support tables
Account, Session, VerificationToken                   — Auth.js adapter tables
```

`db push` has been run successfully against the live Supabase project. All 12
tables exist.

---

## 6. What is CONFIRMED working (actually tested live, not just written)

- `npm install`, `npx prisma generate`, `npx prisma db push` — all succeeded
- `npm run dev` runs; landing page renders with the correct pink theme
- Full registration → console-logged verification code → verify → session
  established → redirected to `/dashboard`
- Sign out / sign in
- `/dashboard`, `/modules`, `/feedback`, `/profile` all render without error
  (confirmed via terminal `GET ... 200` lines)
- Seed data exists: 3 modules, 6 exercises, in Postgres (confirmed in Prisma
  Studio)

## 7. What is written but NEVER confirmed working

This is the important list. None of these are known to be broken — they just
haven't been exercised yet, and this build has already found real bugs in
things that looked fine on paper.

- **Recording** (`MediaRecorder`, the whole `Recorder.tsx` flow) — never
  attempted
- **File upload** (`Uploader.tsx`, the signed-URL-to-Supabase-Storage path) —
  never attempted
- **The full submit pipeline** — `/api/upload-url` → direct `PUT` to storage →
  `/api/submissions` — never run end to end
- **Any teacher-side flow** — role flip, `/queue`, `/review/[id]`, filling the
  rubric, submitting an audit — never attempted
- **Enrollment button** — never clicked
- **Autoplay preference** — untestable so far; no `REVIEWED` submission exists
  to open
- **Email-on-audit** — untestable so far; no audit has ever been submitted
- **Larger text toggle** — built, not confirmed visually verified
- **Header second row** (`StudentStats`/`TeacherStats`) — built, not confirmed
  visually verified
- **`/settings` and `/students` pages** — not confirmed visited
- **`npm run build`** (the real production build) — only ever run inside
  Claude's own sandbox, never on the actual project directory
- **Vercel deployment** — not started

## 8. Not built at all

- **Teacher's "send it back" action for `RETURNED` status.** The schema has
  the enum value; nothing in the UI or API can set it. This needs a schema
  change (a reason field on `Submission`) and is explicitly waiting on a
  go-ahead before touching `schema.prisma` again.
- Draft autosave in `RubricForm` (closing the tab mid-audit loses it)
- `passwordChangedAt` for invalidating JWTs after a password reset
- `LoginAttempt` cleanup job (rows accumulate forever)
- A storage `HEAD` check before creating a `Submission` row (a skipped upload
  currently creates a row pointing at a file that was never written)
- A release-claim action for a submission stuck `IN_REVIEW` with a missing file
- Google OAuth, guest mode (both mentioned in the original brief, neither built)
- Real testimonials/stats/ratings on the landing page (correctly withheld —
  no real students exist yet to quote)
- SendGrid domain authentication (currently dev-mode console logging only)
- Legal pages are drafts matching the code, explicitly flagged as needing a
  lawyer before launch

---

## 9. Immediate next step

Confirming a real `Submission` row can be created through the actual UI
(record or upload on a practice page), then walking the full round trip:
student submits → flip account to `TEACHER` in Supabase → sign out/in →
`/queue` → `/review/[id]` → score it → `/api/feedback` submit → flip back to
`STUDENT` → sign out/in → `/feedback/[id]` → confirm autoplay fires and the
email log appears in the terminal.

This single test, if it passes, validates: the recorder, the upload pipeline,
the claim race-guard, the rubric form, the note-timestamp seeking, the
autoplay preference, and the email notification — all at once, since none of
them have been exercised even once yet.

---

## 10. Environment (structure only — no real values here)

- Supabase project region: `ap-southeast-1` (Singapore)
- Storage bucket: `submissions`, private, 100MB limit, MIME allowlist covers
  audio/webm, audio/mp4, audio/mpeg, audio/ogg, audio/wav, video/webm,
  video/mp4, video/quicktime, image/jpeg, image/png, image/webp
- `.env` (not `.env.local` — Prisma only reads `.env`) holds: `DATABASE_URL`
  (port 6543, pooled), `DIRECT_URL` (port 5432), `AUTH_SECRET`,
  `AUTH_TRUST_HOST`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `SENDGRID_API_KEY` (currently empty), `EMAIL_FROM`, `NEXT_PUBLIC_APP_URL`,
  `SMS_ENABLED=false`
- The Supabase secret key used during setup was pasted into a chat at one
  point — flagged for rotation, not yet confirmed done.

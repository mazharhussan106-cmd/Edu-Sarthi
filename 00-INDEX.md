# Edusarthi — build index

**78 files. STATUS: nothing has been run.** No `npm install`, no `prisma db
push`, no page rendered. Everything here was written from the brief without a
running environment. Read `README.md` for the first-run sequence and
`CLAUDE.md` before writing any code.

---

## Assumptions made

These were decided rather than asked, so that the build could complete.

1. **"Phase 9" is not in the brief, which has eight phases.** Taken to mean
   handover — `CLAUDE.md`, `README.md`, `DEPLOY.md`.
2. **`--color-pink` renamed to `--color-accent`.** The Ocean theme puts a blue
   in that slot; a token named after one theme's hue misleads.
3. **Light accent is `#dc2087`, not the brief's `#e0218a`.** White on the logo
   pink measures 4.42:1 and fails WCAG AA for text under 18pt.
4. **Ocean accent is `#007cb2`, not HP's `#0096D6`.** Same reason — 3.32:1.
   Theme is called Ocean, not HP, to avoid using another company's trademark.
5. **Auth config split** into `auth.config.ts` (Edge-safe) and `auth.ts`
   (Node). Middleware runs on Edge and cannot load Prisma or bcrypt. The
   brief's B2 middleware sketch would not build.
6. **Register never accepts a role.** Teacher accounts are made by editing the
   row in Supabase. A client-supplied role hands anyone the submission queue.
7. **`claimedById` / `claimedAt` added to `Submission`.** Without them two
   teachers can both audit one submission and the second insert fails on the
   unique constraint after the typing.
8. **Login throttle is database-backed**, not an in-memory Map. Serverless
   resets memory constantly; a Map works on localhost and does nothing live.
9. **Verification codes and reset tokens are stored hashed.** Not specified in
   the brief; a database dump should not be replayable.
10. **Storage is Supabase, private bucket `submissions`**, reads via 30-minute
    signed URLs. Vercel Blob would also work; Supabase keeps it to one vendor.
11. **Landing page has no testimonials, stats strip or rating summary.** There
    are no real students. Inventing them breaks the honest-copy rule.
12. **Legal pages are drafts written from the codebase.** Every claim maps to a
    column or a function. They are not legal advice and need a lawyer familiar
    with India's DPDP Act 2023 before launch.
13. **Contact addresses assumed:** `support@edusarthi.com`,
    `privacy@edusarthi.com`, `noreply@edusarthi.com`.
14. **Dashboard trend plots the five-criterion average**, not five lines. Five
    overlapping lines on a phone is noise.
15. **`/students` roster is unpaginated** and lists only students who have
    submitted. Fine to a few hundred; needs a cursor past that.
16. **Preferences are a fixed allowlist** (`emailOnAudit`, `autoplayAudit`,
    `largerText`) merged into the `preferences` Json column. `emailOnAudit` is
    stored but no audit-notification email is sent yet.
17. **Seeded demo submission stores `/sample.mp3`**, a file in `public/`.
    `resolveMediaUrl` has a branch for paths starting with `/` so it keeps
    playing. You must add that file yourself.

---

## Files

| File | Phase | Purpose |
|---|---|---|
| `prisma/schema.prisma` | 1 | Whole database shape, 6 themes, claim fields |
| `prisma/seed.ts` | 1 | 3 modules, 6 exercises, one demo submission |
| `.env.example` | 1 | Env var reference, no secrets |
| `app/globals.css` | 1 | 24 tokens × 6 themes, contrast-checked |
| `app/layout.tsx` | 1 | Fonts, theme attribute read from cookie |
| `lib/utils.ts` | 2 | `cn()` class merge |
| `lib/prisma.ts` | 2 | Client singleton, survives hot reload |
| `lib/theme.ts` | 2 | Theme list, enum ↔ CSS attribute mapping |
| `components/ui/Button.tsx` | 2 | primary / outline / ghost, sm / md |
| `components/ui/Card.tsx` | 2 | Card, CardHeader, CardTitle |
| `components/ui/Input.tsx` | 2 | Input and Label, generated id fallback |
| `components/ui/Badge.tsx` | 2 | accent / neutral / success / error pill |
| `components/ui/Switch.tsx` | 2 | Settings toggle row with description |
| `components/ui/SegmentedControl.tsx` | 2 | Radio pills, native keyboard support |
| `components/ui/PasswordInput.tsx` | 2 | Eye toggle, advisory strength meter |
| `lib/validations.ts` | 3,5 | Every Zod schema, auth through upload |
| `lib/verification.ts` | 3 | 6-digit code, hashed, timing-safe compare |
| `lib/loginRateLimit.ts` | 3 | 8 attempts / 15 min, no hard lockout |
| `lib/email.ts` | 3 | SendGrid, console in dev, throws in prod |
| `lib/auth.config.ts` | 3 | Edge-safe config — middleware imports this |
| `lib/auth.ts` | 3 | Credentials provider, adapter, Node only |
| `types/next-auth.d.ts` | 3 | role and emailVerified on session and JWT |
| `app/api/auth/[...nextauth]/route.ts` | 3 | Mounts the NextAuth handlers |
| `app/api/register/route.ts` | 3 | Signup, never reads a role from the body |
| `app/api/auth/verify/route.ts` | 3 | Verify a code and resend one |
| `app/api/auth/forgot-password/route.ts` | 3 | Issue a hashed reset token |
| `app/api/auth/reset-password/route.ts` | 3 | Consume it, set the new password |
| `middleware.ts` | 3 | Auth gate, verification gate, role guard |
| `app/(auth)/layout.tsx` | 3 | Narrow shell plus SessionProvider |
| `app/(auth)/login/page.tsx` | 3 | Sign in, role-aware redirect |
| `app/(auth)/register/page.tsx` | 3 | Sign up, live password confirm |
| `app/(auth)/verify/page.tsx` | 3 | Code entry, resend with cooldown |
| `app/(auth)/forgot-password/page.tsx` | 3 | Request a reset link |
| `app/(auth)/reset-password/[token]/page.tsx` | 3 | Set a new password |
| `components/layout/StickyHeader.tsx` | 4 | Two-row collapse, 1400px merge |
| `components/layout/NavLinks.tsx` | 4 | Nav row with active underline |
| `components/layout/MobileMenu.tsx` | 4 | Sheet below 768px, scroll lock |
| `components/layout/SettingsMenu.tsx` | 4 | Header theme picker and sign out |
| `components/layout/Footer.tsx` | 4 | Brand, link row, legal line |
| `app/api/profile/theme/route.ts` | 4 | Theme cookie plus user row |
| `app/page.tsx` | 4 | Landing page, zero JavaScript |
| `app/(student)/layout.tsx` | 4 | Student shell |
| `app/(teacher)/layout.tsx` | 4 | Teacher shell |
| `lib/storage.ts` | 5 | Signed upload and read, private bucket |
| `lib/media.ts` | 5 | Duration reading, Safari codec choice |
| `app/api/upload-url/route.ts` | 5 | Validate, then mint the upload URL |
| `app/api/submissions/route.ts` | 5 | Create the row, re-derive key ownership |
| `components/media/Uploader.tsx` | 5 | Drag-drop, type and size checks |
| `components/media/Recorder.tsx` | 5 | MediaRecorder, level meter, retake |
| `components/media/Player.tsx` | 5 | Seekable playback, time callback |
| `components/media/SubmitPanel.tsx` | 5 | Upload direct to storage, then save |
| `app/(student)/practice/[id]/page.tsx` | 5 | Prompt, submit panel, past attempts |
| `components/dashboard/ScoreTrend.tsx` | 6 | Recharts line, theme-aware colours |
| `app/(student)/dashboard/page.tsx` | 6 | In-flight work, trend, weakest score |
| `app/(student)/modules/page.tsx` | 6 | Module list with progress counts |
| `app/(student)/modules/[id]/page.tsx` | 6 | Exercise list with per-exercise status |
| `app/(student)/feedback/page.tsx` | 6 | Every audit received |
| `app/(student)/feedback/[id]/page.tsx` | 6 | One audit, notes seek the player |
| `components/review/AuditPlayback.tsx` | 6 | Client boundary for seek-to-note |
| `app/(teacher)/queue/page.tsx` | 7 | Pending queue, oldest first |
| `app/(teacher)/review/[id]/page.tsx` | 7 | Claims on open, signs the media URL |
| `components/review/RubricForm.tsx` | 7 | Scores, timestamped notes, summary |
| `components/review/NoteList.tsx` | 7 | Shared note list, seek and remove |
| `app/api/feedback/route.ts` | 7 | Claim and submit, race-safe |
| `app/(teacher)/students/page.tsx` | 7 | Roster sorted by outstanding work |
| `app/api/profile/preferences/route.ts` | 8 | Per-setting PATCH, merged not replaced |
| `app/(shared)/layout.tsx` | 8 | Role-aware shell for settings and profile |
| `app/(shared)/settings/page.tsx` | 8 | Reads theme and preferences server-side |
| `app/(shared)/settings/SettingsForm.tsx` | 8 | Auto-saving theme and toggles |
| `app/(shared)/profile/page.tsx` | 8 | Account details and per-role totals |
| `app/(public)/layout.tsx` | 8 | Shell for signed-out readable pages |
| `app/(public)/about/page.tsx` | 8 | How it works, what the scores mean |
| `app/(public)/support/page.tsx` | 8 | Real failures with the fix beside each |
| `app/(public)/legal/privacy/page.tsx` | 8 | Draft policy matching the codebase |
| `app/(public)/legal/terms/page.tsx` | 8 | Draft terms matching what is enforced |
| `CLAUDE.md` | 9 | Standards and gotchas for the next session |
| `README.md` | 9 | First-run sequence and known gaps |
| `DEPLOY.md` | 9 | Vercel, env vars, storage, post-deploy walk |

---

## Not built, on purpose

Upload progress bar · storage `head` check before insert · release-claim for a
stranded `IN_REVIEW` · draft autosave in `RubricForm` · `passwordChangedAt` for
JWT invalidation after a reset · `LoginAttempt` cleanup job · audit-notification
email · guest mode · leaderboard · certificates.

## Compare against TypeSarthi before trusting

`StickyHeader`, `PasswordInput`, the seven UI primitives, and the
`VerificationCode` / `PasswordResetToken` / `LoginAttempt` / `Theme` parts of
the schema. These were written from the spec, not ported.

---

## Pre-deploy audit — 26 August 2026

Run against the code, not against a live environment.

**Fixed:**

| Issue | Severity | Fix |
|---|---|---|
| No `.gitignore` at all | Critical — `.env` would have been committed on the first push | Added, with `.env` ignored and `.env.example` explicitly un-ignored |
| Preference schema lived inside `app/api/profile/preferences/route.ts` | Latent — importing it into any client component would pull Prisma and Auth.js into the browser bundle | Moved to `lib/preferences.ts` |
| `app/api/auth/[...nextauth]/route.ts` re-exported `GET` and `POST`, which `lib/auth.ts` does not export | Critical — build failure, all sign-in broken | Now `export const { GET, POST } = handlers` |
| `ScoreTrend` tooltip formatter used the recharts 2 signature | Build failure on recharts 3 | Coerces the value instead of assuming `number` |
| Scaffold files missing entirely | Nothing could be built | Added `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs` |

**Verified clean:**

- No client component imports `lib/storage`, `lib/prisma` or `lib/auth`.
- `middleware.ts` imports `lib/auth.config` only — Prisma never reaches the Edge runtime.
- The service-role key and SendGrid key are read only in `lib/storage.ts` and
  `lib/email.ts`, both server-only.
- The only `NEXT_PUBLIC_` variable is an app URL, which is not a secret.
- No real credentials anywhere in the tree. The connection strings in
  `README.md` and `.env.example` are placeholders.
- `next build` reports **compiled successfully** across all routes — no route
  group collisions, no client/server boundary violations, no Tailwind v4 errors.

**Known, not fixed:**

- Next.js 16 deprecates the `middleware.ts` convention in favour of `proxy.ts`.
  It still works and only warns. Migrate with
  `npx @next/codemod@canary middleware-to-proxy .` when convenient.
- `npm audit` reports vulnerabilities in the transitive dependency tree. Review
  with `npm audit` before launch; do not run `npm audit fix --force`, which
  will change majors.

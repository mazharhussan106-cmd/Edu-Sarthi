# Phase 0 — live test checklist

Part of `docs/LIBRARY-V2-PLAN.md`. Phase 1 starts only after this passes on the live site.

## What is already done (27 Oct 2026)

- **Database setup was run on the live database** (GitHub Actions run #7, success). It had last run *before* the AI features (PR #17) were merged, so the live database was missing the new columns, and that can break sign-in. The log says "Your database is now in sync"; no existing cards were changed.
- **The whole round passed on a local copy.** It used a local database, the real code from `main` and a phone-sized browser. Results are under "Local results" below. That proves the app's logic. It does **not** prove that Supabase storage, SendGrid email, YouTube embeds or Vercel work, so you need to check those on the phone.

## Before you start (5 minutes)

1. **Vercel → your project → Deployments.** The newest deployment should be "Merge pull request #17" and show **Ready**. If it is older or failed, open it and press **Redeploy**.
2. **Vercel → Settings → Environment Variables.** These must exist:
   - `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `SENDGRID_API_KEY`, `EMAIL_FROM`
   - `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`

   These are optional:
   - `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` turn on Google sign-in.
   - `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` turn on the AI features. Without them, the AI buttons are hidden.

   If you add or change a variable, Redeploy.
3. **Supabase → Storage → `submissions` bucket.** It must be **Public: OFF**. Its allowed types should include `audio/webm`, `audio/mp4`, `audio/mpeg`, `audio/ogg`, `audio/wav`, `image/jpeg`, `image/png` and `image/webp`. Add `application/pdf` only if you set `ANTHROPIC_API_KEY`: the AI card maker uploads PDFs.
4. **Test accounts.** You need four. Gmail "plus" addresses all arrive in your own inbox:
   - your admin account
   - `yourname+student@gmail.com`
   - `yourname+teacher@gmail.com`
   - `yourname+institute@gmail.com`

   Use a different browser or an incognito window for each, so they don't sign each other out. To make the teacher account a teacher: **Admin → Users**, change its role to Teacher, then sign out and back in on that account.

## Round 1 — student deck (phone)

| # | Do this | You should see |
|---|---|---|
| 1 | Sign in as the student with the email code | The code arrives by email within a minute; you land on the dashboard |
| 2 | Menu → My decks → make a deck with 3 cards | The deck page lists 3 cards |
| 3 | Add a **picture** to one card and **record audio** on another | Both show after saving, and still show after a page reload (this checks Supabase storage) |
| 4 | Open **Study** | The EduSarthi card with the navy band, and Known / Unknown / Remark |
| 5 | **Create share link** → send it on WhatsApp → open it on another phone that is not signed in | The deck opens, read-only |
| 6 | **Submit for the public library** | "Waiting for review" |
| 7 | As admin: Admin → Decks → open it → **Approve** | "Published". The student gets an "approved" email |
| 8 | As the institute account (it is an ordinary student until Round 3): Menu → Library → open the deck → **like** → **Copy to my decks** | The copy opens in My decks |
| 9 | Report the deck → as admin, Admin → Decks → **Dismiss reports** | The report disappears |

## Round 2 — teacher deck

| # | Do this | You should see |
|---|---|---|
| 1 | As teacher: make a deck with 3 cards; on one, add a **YouTube link** and a **Teacher's guide** | Saved |
| 2 | Press **Submit for the public library** before verification | "An admin needs to verify your teacher account…" |
| 3 | As admin: Admin → Users → the teacher → **Verify teacher** (type a reason) | The button disappears |
| 4 | As teacher: submit again → as admin: approve | "Published", with a "Verified teacher" badge in the library |
| 5 | As student: open it in the library | **The YouTube video plays** inside the card |
| 6 | As student: tap **Record yourself** on a card → record **at least 15 seconds** → **Send to a teacher** | You land on Audited, marked "In review" |
| 7 | As teacher: Queue → **Claim** → set all 5 scores, add a note and a summary → **Submit audit** → **Yes, send to student** | Back to the queue |
| 8 | As student: Audited | The audit with its scores. The "audit ready" email arrives if that setting is on |

## Round 3 — institute

| # | Do this | You should see |
|---|---|---|
| 1 | As the institute account: Menu → Institute → apply | "Waiting for approval" |
| 2 | As admin: Admin → Institutes → **Approve** | Status Approved |
| 3 | As the institute account: Institute page | An 8-letter join code |
| 4 | As student and as teacher: Institute → enter the code → **Join institute** | The institute's name. A wrong code shows an error |
| 5 | As the institute account: the teacher's row → **Make teacher** | The button changes to "Make student" |
| 6 | As teacher: make a deck → **Share with my institute** | "Shared with your institute" |
| 7 | As student: Institute → open the deck → **Copy to my decks** | The copy opens. The deck is **not** in the public Library |

## When something fails

Send a screenshot, the step number, and the time it happened. To find the error: **Vercel → your project → Logs**, filter to that minute and copy the red lines. Fix one thing at a time; do not start Phase 1 until all three rounds pass.

## Local results (27 Oct 2026, dev server, local Postgres, Playwright at 412×900)

- Round 1: 12 of 12 steps passed: create deck, add cards, study, share link signed out, submit, admin approve, library, like, copy, "Published" badge, and today's rule that an edit sends the deck back to review. The database showed 1 like, 1 copy and 4 cards.
- Round 2: all steps passed: the unverified teacher is blocked, the admin verifies, approves, the student uploads a recording, it reaches only that teacher's queue, the teacher claims and audits, and the student sees "Completed 6.0/10". One audit row was saved, and the audit email was produced.
- Round 3: 9 of 9 passed: apply, approve, join code, wrong code refused, join, make teacher, share with the institute, the student copies it, and it is not in the public library.
- Extra: report → admin dismiss; Explore → "Import and study" opens the study page.
- Not checked locally: YouTube playback (the test computer has no internet), Supabase uploads (the local copy stores files on disk), real emails (printed instead of sent), Google sign-in and the AI features (no keys).

## Two questions this test raised (owner decides)

1. **The Teacher's guide shows to students on the library page**, on the back of the card. The code does this on purpose ("what to listen for" helps the learner). The old plan's line "students never see these fields" means the input boxes in the card editor. Should learners keep seeing it, or should it be teacher-only?
2. **A recording on a deck card must be at least 15 seconds** (`prisma/import-words.ts`, the shared "Word" exercise). For a one-line card like "Could you repeat that?", that is long. Should card recordings have a shorter minimum (for example 3 seconds)?

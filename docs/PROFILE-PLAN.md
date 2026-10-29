# Profile page plan (v1.0, 29 Oct 2026)

Branch `claude/busy-johnson-epz1lg`. Scope: the Profile page only (`/profile`) for student, teacher and admin. Status: **BUILT, NOT YET MERGED**. P1–P6 are done and pushed on this branch (see "Build log"). **Next action (owner):** open a PR and merge it. Then run Actions → Database setup at once (it adds `User.avatarKey`; the Profile page fails without it), and send the privacy-change email from Admin → Announcements (the Privacy page promises it). Finally, try the Profile on a phone, as student, teacher and admin.

Mockup: `docs/profile-mockup.html` (open it in a browser; Light/Dark buttons at the top). Screenshots: `docs/profile-mockup-phones.png`, `-phones-dark.png`, `-sheets.png`, `-sheets-dark.png`, `-desktop.png`, `-desktop-dark.png`. The orange tags in the mockup (S1, T2…) are the row IDs in the lists below.

## Owner's answers (29 Oct 2026)

| Question | Answer |
|---|---|
| Which roles? | **All roles**: student, teacher and admin |
| Avatar | **Photo upload** |
| New student sections | **All four**: speaking scores, streak calendar, goal with a date, shareable card |
| What this chat delivers | **Plan + mockup, then build** after approval |

**Conflict, recorded.**
- **Before:** "No profile photo for now" (an assistant decision the owner delegated on 28 Oct, marked "revisit if users ask").
- **Now:** on 29 Oct the owner chose photo upload, so that decision is SUPERSEDED.
- **Still open:** who may see a photo (question 2 below).

## Owner's second answers (29 Oct 2026), after the mockup

| Question | Answer | What it changes |
|---|---|---|
| What counts as a practice day? | **A recording or a card answer** | One rule everywhere: the dashboard streak and the streak badges follow it too (owner approved the dashboard change by choosing this) |
| Who sees a photo? | **Only the owner** | No approval queue. Teachers keep seeing STU-IDs. An admin can remove a reported photo. |
| Teachers see their QA notes? | **Yes** | T4 "Quality checks" moves from Later to Must (phase P4) |
| Build P1–P6? | **Approved, all** | Built in order, each phase tested and pushed before the next |

## Research summary

Sources are rated CONFIRMED (official page from the company) or UNVERIFIED (third-party review, fan wiki or search snippet). Screens change often, so none of this was checked inside the apps themselves.

| App / guide | What its profile shows | What we take | Rating |
|---|---|---|---|
| Duolingo | Achievement badges and "personal records" (longest streak, most XP in a day). Friends are added from the profile tab. Streak share cards to save or post. | Personal records (longest streak), badges on the profile, a share card made in the app | CONFIRMED: [badges](https://blog.duolingo.com/achievement-badges), [friends](https://blog.duolingo.com/friends-social-features/), [share card](https://blog.duolingo.com/streak-milestone-design-animation) |
| Duolingo (stats) | The longest-streak record survives a missed day | Longest streak is a record that never resets | UNVERIFIED: [fan wiki](https://duolingo.fandom.com/wiki/Achievements) |
| ELSA Speak | One speaking score plus a breakdown (pronunciation, fluency, intonation and more), and an estimated IELTS/CEFR level | Per-skill bars. We do **not** show an exam estimate: our scores are teachers' rubric scores, and calling them a band would overclaim. | UNVERIFIED: [e-student](https://e-student.org/elsa-speak-review), [alllanguageresources](https://www.alllanguageresources.com/elsa-speak/) |
| Busuu | Stats dashboard: words learned, certificates, study plan with chosen times | A goal with a daily plan; a certificate is a later idea | CONFIRMED: [Busuu blog](https://blog.busuu.com/?p=11018). Business guide: [PDF](https://business.busuu.com/hubfs/Admin%20Portal/Learners%20-%20self-paced%20learning%20and%201_1%20and%20group%20Live%20Lessons.pdf) |
| Khan Academy | Avatar, energy points (said to measure effort, not mastery), badges, days of activity | Honest labels: our numbers measure practice, not ability | CONFIRMED: [help centre](https://support.khanacademy.org/hc/en-us/articles/202487710-What-are-energy-points-) |
| Speak / Praktika | Progress sits in a "Results" area or on the home screen; the profile mostly holds the account and subscription | Keep account and privacy on the profile, and link to Progress for the long view | UNVERIFIED: [Speak update](https://www.androidauthority.com/speak-language-learning-3623764/), [Praktika](https://apps.apple.com/us/app/-/id1624701477) |
| italki (teacher pages) | Rating, students, lessons, attendance, response rate, bio, reviews | Teacher stats: audits written, students helped, typical turnaround. Bio and reviews later. | UNVERIFIED: [sample page](https://italki.com/en/teacher/3007774) |
| Coursera / LinkedIn Learning | Certificates and skills sent to the LinkedIn profile | A later idea (EduSarthi has no certificate yet) | UNVERIFIED: [Coursera blog](https://blog.coursera.org/add-coursera-accomplishments-to-your-linkedin), [LinkedIn help](https://www.linkedin.com/help/learning/answer/71929) |
| Anki Review Heatmap | A year of squares, current streak, longest streak, % of days studied | The practice calendar and its summary line | CONFIRMED: [add-on](https://github.com/glutanimate/review-heatmap) |
| GitHub contribution graph | Screen readers get it as a table; each day has a summary; keyboard works; "View as table" | Our calendar gets a label on every square and a "View as list" | CONFIRMED: [GitHub changelog](https://github.blog/changelog/2023-03-02-accessibility-improvements-for-the-contribution-graph/) |
| Heatmap accessibility | Colour alone is not enough; offer a table or list | Count in each square's label, plus the list view | UNVERIFIED: [ulster.ac.uk](https://ulster.ac.uk/accessibility-standards/graphs-and-tables) |
| Profile UX guides | Identity at the top; activity summary; badges; keep editing apart from viewing; show the next best action | Header card, stat tiles, an Edit profile sheet, a "Get started" card for new users | UNVERIFIED: [UXPin](https://www.uxpin.com/studio/?p=50781), [Eleken](https://eleken.co/blog-posts/profile-page-design) |
| Photo privacy | Phone photos carry GPS and device data; re-encoding the image removes it; strip on the server too | Crop and re-encode to 512×512 WebP in the browser, re-check on the server | UNVERIFIED: [flaviocopes](https://flaviocopes.com/exif-metadata-privacy/) |
| DPDP (India) | A child is under 18; a child's data needs verifiable parental consent; no tracking or targeted ads for children. Reported start for the child duties: around May 2027. | Photos are a child's personal data, so they follow the parental-consent item already open in `LEGAL-REVIEW-PACK.md` | UNVERIFIED (commentary, not the official text): [dpdpa.com Rule 10](https://www.dpdpa.com/dpdparules/rule10.html), [EY](https://www.ey.com/en_in/insights/cybersecurity/transforming-data-privacy-digital-personal-data-protection-rules-2025) |

I could not see TypeSarthi's profile page: it needs a sign-in, and a search found nothing.

## The list: what the Profile shows

Priority: **Must** (first build), **Should** (same project, after Must), **Later** (not now). "Data" names where the number comes from. Everything is computed when the page loads unless it says "new".

### Student

| ID | Section | What it shows | Data | Priority |
|---|---|---|---|---|
| S1 | Identity card | Photo (or initials), name, "Student · joined Oct 2026", STU ID, institute chip, **Edit profile** and **Share progress** buttons, and the line "Only you see your photo and name. Teachers see you as STU-…" | `User` (name, publicId, createdAt), `InstituteMember`; photo is **new** (`User.avatarKey`) | Must (photo: Must, phase P5) |
| S2 | Stat tiles | Day streak, longest streak, cards known, audits received | `Submission`, `ReviewLog`, `CardState` (built-in cards only) | Must |
| S3 | My goal | Practising for, level (self-described, says so), **target date and days left**, today's plan (1 recording, N new cards) with two small bars | `preferences.goal`, `level`, `newPerDay`; **new preference key `goalDate`** (JSON, no table) | Must |
| S4 | Speaking scores | Five bars out of 10: average of the last 5 audits, and the change since the first audit; "Teachers' scores, not an exam band"; link to Progress | `Feedback` scores via `criteriaChange()` in `lib/studentStats.ts` | Must |
| S5 | Practice calendar | 16 weeks on a phone, 52 on a computer; shade = how much practice; today outlined; "View as list"; practice days and longest streak; "Card answers counted from 26 Oct 2026" | `Submission.createdAt` + `ReviewLog.createdAt` by India day | Must |
| S6 | Badges | Round badges, grey with a hint when locked; "5 of 12". Four new ones: Goal set, 14-day streak, Score up (+1 on any skill), Shared a deck | `lib/badges.ts` (computed, nothing stored) | Must (4 new: Should) |
| S7 | My content | My decks (count, share links), In the library (decks, followers), Decks I follow | `Deck`, `DeckFollow` | Must |
| S8 | Shortcuts | Institute, History, Settings (`SheetRow` style) | links | Must |
| S9 | Account and privacy | Email and verified date; phone ("stored, not verified, never used for SMS"); **Who sees what** sheet; Download my data; Delete my account (type DELETE) | `User`, `/api/me` | Must |
| S10 | Get started | Shown until done: make an account, set your goal, first recording, first 10 cards | same counts as S2/S3 | Should |
| S11 | Share progress | A picture made **in the browser**: first name, streak, cards known, badges, best skill change; each item has its own toggle; photo off by default; never the STU ID or email; Share (phone share menu) or Download | same numbers; no new data, nothing uploaded | Must (phase P6) |
| — | Guest variant | No photo and no phone. A banner says progress stays on this account and links to Settings → "Keep your progress". Share progress still works. | `User.isGuest` | Must |

### Teacher

| ID | Section | What it shows | Data | Priority |
|---|---|---|---|---|
| T1 | Identity card | Photo, name, "Teacher · joined…", **Verified teacher** chip (or "Not verified yet"), institute; line "Students do not see your name or photo on their audits" | `User.teacherVerifiedAt`, `InstituteMember` | Must |
| T2 | Stat tiles | Audits written, this month, students helped (distinct), typical turnaround (median hours from recording to audit, last 30 audits) | `Feedback` + `Submission` | Must |
| T3 | Reviewing calendar | Days with audits written | `Feedback.createdAt` | Should |
| T4 | Quality checks | "1 of your audits was marked for a second look in 90 days" + the note | `Feedback.qaFlaggedAt`, `qaNote`. Until now only admins saw these. | Must (owner, 29 Oct) |
| T5 | My content | Teaching decks, in the library, learners following | `Deck`, `DeckFollow` | Must |
| T6 | Shortcuts | Queue (n waiting), My students, Settings | existing pages | Must |
| T7 | Account and privacy | Email, phone, Download my data. No delete row: teacher accounts are closed by support (`/api/me` DELETE says so) | `User` | Must |
| — | Bio / about me | A short text about the teacher | **new column**, and no page shows it to students yet | Later |

### Admin

| ID | Section | What it shows | Data | Priority |
|---|---|---|---|---|
| A1 | Identity card | Photo, name, Administrator chip | `User` | Must |
| A2 | Stat tiles | Actions this week, decks reviewed (30 days), decks waiting, logos waiting | `AdminLog`, `Deck.reviewedById`, `Deck.status`, `Institute.pendingLogoKey` | Must |
| A3 | Your recent actions | Last 5 `AdminLog` rows by this admin, in plain words | `AdminLog` (actorId) | Must |
| A4 | Activity calendar | Days with admin actions | `AdminLog.createdAt` | Should |
| A5 | Shortcuts | Overview, Decks to review (n), Users, Site settings | existing pages | Must |
| A6 | Account and security | Email; "Password and sign-out are in Settings → Account & security" | `User` | Must |

### Not on the Profile (on purpose)

- **Leaderboards, friends, followers of a person.** They are against the anonymous-ID rule, and many users may be minors.
- **An IELTS or CEFR "estimate".** Our scores are teachers' rubric scores, not a test.
- **Public profile page.** Not asked for. It would also need its own privacy rules.
- **Certificates.** Not asked for. It is a revenue idea for `ROADMAP-EARNING.md`.
- **Settings controls.** They stay in Settings (phase M). Profile only links there.

## Rules for the build

- Server components by default. Client components only for sheets, the photo cropper, the share card and the calendar's list toggle.
- Editing happens in sheets (`components/ui/Sheet`, `SheetRow`, `RadioList`, `Switch`), the same pattern as Settings phase M.
- Tokens only (no `bg-white` and no Tailwind palette). The share card is drawn on a canvas, so it takes its colours from one constants file built from the token values.
- Calendar: every square has an `aria-label` ("12 Oct: 1 recording, 24 cards"), shades are never the only signal, and "View as list" shows a real list. India days (`Asia/Kolkata`).
- Photo: JPG/PNG/WebP up to 5 MB picked. It is cropped and re-encoded in the browser to a 512×512 WebP (this drops GPS and other EXIF), then uploaded to Supabase Storage through `createUploadTarget` (the same pattern as `lib/instituteLogo.ts`). The server checks the key, type and size. The photo is included in Download my data, deleted with the account, and named on the Privacy page.
- Copy is honest: "my own pick" for level, "Teachers' scores, not an exam band", "Card answers counted from 26 Oct 2026".
- `app/(shared)/profile/page.tsx` becomes a small role switch; each part goes in `components/profile/`, and every file stays under ~250 lines.

## Build phases (each one is tested and pushed before the next)

| Phase | What | Files (about) | Schema |
|---|---|---|---|
| P1 | New layout from existing data: page split, identity card, Edit profile sheet (name, phone), stat tiles, goal card (goal and level), badge grid, content, shortcuts, account and privacy, Who sees what, guest banner, Get started | 12 | none |
| P2 | Speaking scores, practice calendar and list view, longest streak (`lib/profileStats.ts`) | 5 | none |
| P3 | Goal date: `goalDate` preference key and goal sheet | 3 | none (JSON key) |
| P4 | Teacher and admin profiles (T1–T3, T5–T7, A1–A6) | 5 | none |
| P5 | Photo upload: `User.avatarKey` (one nullable column, additive, **no data lost**), `lib/avatar.ts`, `/api/profile/avatar`, crop sheet, export/delete/Privacy page; then Actions → Database setup | 8 | **1 migration** |
| P6 | Share progress card (canvas, Web Share with a file, Download) and the 4 new badges | 4 | none |

That is more than 6 files, so the owner must approve it first (CLAUDE.md). **Approved 29 Oct.**

### Build log

- **P1 done (29 Oct).**
  - New: `lib/practiceDays.ts` (a practice day is a recording or a card answer, counted per India day in SQL), `lib/profileStats.ts`, `components/profile/*` (IdentityCard, EditProfile, StatTiles and rows in ProfileParts, GoalCard and GoalEditor, BadgeGrid, GetStarted, AccountRows, DeleteAccount, StudentProfile, and an interim StaffProfile until P4) and `components/ui/SheetButton.tsx`.
  - Changed: `lib/progress.ts` (streak from day numbers, plus `longestStreak`), the dashboard streak (now the same rule), and the badge hints ("Practise N days in a row").
  - Removed: `components/student/AccountActions.tsx` and `ProfileGoals.tsx` (their forms moved into sheets).
  - The page keeps the phone order in the HTML; on a computer, pairs sit side by side, so the Tab order matches on every screen. Guests get no decks and no recording bar.
  - Tested on a local Postgres:
    - edit name and number (bad number error, reset on close, save, remove, restore)
    - goal sheet saves and survives a reload
    - badge list and Who sees what sheets
    - delete account on a throwaway account (button off until DELETE; a tap outside does not close it)
    - `/profile#your-data`; keyboard open and close with focus return
    - dashboard streak = 11 under the new rule
    - axe in five themes for student, teacher and admin, and in light and dark for new student and guest, plus three sheets; only the known logotype contrast is left
    - `tsc` and `next build` pass
- **P2 done (29 Oct).**
  - New: `components/profile/SkillScores.tsx` (average of the last 5 audits per skill; arrows show the change since the first audit; "Teachers' scores, not an exam band") and `components/profile/ActivityCalendar.tsx`.
  - The calendar shows 17 weeks on a phone, 26 on a mid-size screen and 53 on a computer. Shade comes from one recording = 10 card answers. The grid is hidden from screen readers; the summary line and "View as list" carry the same facts.
  - The note "Card answers are counted from 26 Oct 2026" shows only for accounts older than that date.
  - Tested: the score numbers match the test data, and 27 practice days and longest streak 11 match a hand count. The list sheet has 27 rows. Week counts were checked at 390, 820 and 1280 px with no sideways scroll. Empty states checked for a new student. axe passes in five themes and on the list sheet. `next build` passes.
- **P3 done (29 Oct).**
  - New preference key `goalDate` ("YYYY-MM-DD" or "", JSON, no migration) and `lib/goalDate.ts` (India days; real-date check; a save must be today or within three years, while reading also accepts a passed date so the card can say "This day has passed").
  - The goal sheet has a date field with Clear; the card shows the date and "N days left" / "Tomorrow" / "Today. All the best!".
  - `app/api/profile/preferences` refuses a bad date with a reason.
  - Tested: 78 days left, saved across a reload; past date and 31 Feb refused by the server; today wording; clear; axe on the sheet; `next build` passes.
- **P4 done (29 Oct).**
  - New: `lib/staffProfileStats.ts`, `components/profile/TeacherProfile.tsx` and `AdminProfile.tsx`; `StaffProfile.tsx` (interim) removed.
  - **Teacher:**
    - Verified teacher chip, or a line saying an admin verifies teachers.
    - Audits written, this month, students helped, turnaround over 30 days (the same median as Workload, so the pages agree).
    - Reviewing calendar.
    - **Quality checks**: QA notes from the last 90 days, shown to the teacher who wrote the audit (owner, 29 Oct; until now admin-only).
    - Decks and followers.
    - Queue with "N waiting" (the same `queueScope` rule as the Queue page), My students, Workload, Settings.
  - **Admin:**
    - Own actions this week, own decks reviewed in 30 days, decks and logos waiting.
    - Last 5 admin-log actions, activity calendar, shortcuts.
  - Neither profile shows a student's name. Teacher and admin accounts are still closed by support, and the page says how.
  - Tested: tiles against the test data; queue count equal to the Queue page; turnaround equal to Workload (30 days); no student name or email on the teacher profile; axe in five themes for both; `next build` passes.
- **P5 done (29 Oct). The one schema change: `User.avatarKey String?`** (nullable, additive; no data can be lost).
  - New:
    - `lib/avatarFile.ts`: file rules, shared by the browser and the API.
    - `lib/avatar.ts`: signed upload, save, remove, read URL.
    - `app/api/profile/avatar`: POST `upload` and `save`, DELETE; members only.
    - `components/profile/PhotoEditor.tsx`: pick, crop and upload, inside the Edit profile sheet.
  - **How the photo is made:**
    - The browser crops it (drag, arrow keys or the zoom slider) and draws it again at 512 × 512 as WebP (JPEG where WebP cannot be written). That removes the camera data (GPS, phone model) and keeps the upload small.
    - The server accepts only that small file, and only under a key it issued to this person, once the file exists.
    - Replacing a photo deletes the old file after the row points at the new one.
  - **Who sees it:** only the owner, on their own Profile (owner, 29 Oct). Nobody else gets a URL, so there is no approval queue and no admin tool to remove one: nobody can see a photo to report it. Guests get no photo.
  - **Data rights:** Download my data includes a 30-minute link to the photo; Delete my account deletes the file. The Privacy page has a new line, and its date is now 29 October 2026.
  - **Before this reaches users:**
    1. Merge, then run **Actions → Database setup** at once, so the live database has the new column. The Profile page reads it, so the page fails until then.
    2. Per the Privacy page's own promise ("we will … email account holders before the change takes effect"), send the change email from Admin → Announcements before, or as, the photo goes live.
  - Tested with the local file store:
    - A wrong file type is refused in the browser. The crop step works by keyboard. The stored file is WEBP 512 × 512 with no EXIF, made from a test JPEG with GPS and a camera model.
    - Replacing a photo deletes the old file. The export has a link. Someone else's key is refused (400). A guest has no photo section and the API refuses them (403).
    - Removing a photo restores the initials and deletes the file. Deleting an account deletes its photo.
    - The photo's key appears on no teacher page (queue, students, student page and history) and no admin page (overview, users, dispatch).
    - axe passes on the crop step. P1–P4 suites rerun: all pass. `next build` passes.
- **P6 done (29 Oct).**
  - **Badges:** four new ones (Goal set, 14-day streak, Score up, Shared a deck), so 12 in all. Streak badges now read the **longest** streak, a personal record, so a badge once earned does not disappear when a streak breaks. Still computed, nothing stored.
  - **Share progress:** `components/profile/ShareProgress.tsx` with `lib/shareCard.ts`.
    - A 1080 × 1350 PNG drawn in the browser and never uploaded.
    - A switch for each item: first name, photo (off by default), streak, cards known, badges, best skill change. Items with nothing to show have no switch.
    - Share uses the phone's own menu where the browser can share files; otherwise Download.
    - Never shows the STU ID or the email.
    - Its colours are fixed brand values (a picture cannot follow the theme), named once in `lib/shareCard.ts`, like `app/manifest.ts` does.
  - Tested:
    - 10 of 12 badges for the test student, with the new hints listed.
    - The preview draws and redraws when a switch changes; the photo is drawn with no taint error.
    - Download gives `my-edusarthi-progress.png` at 1080 × 1350. A new student gets no name, photo or skill switches. axe passes on the sheet.
    - Every suite (P1–P6) rerun at the end: all pass, except one P5 check that assumed the student had no photo yet (the P6 test had given them one; the sheet correctly showed "Change photo"). `next build` passes.
  - Built screenshots: `docs/profile-built-phone.png` (the profile and the share sheet) and `docs/profile-built-desktop.png`.

### Not done, on purpose

- **A camera badge on the avatar** (it is in the mockup): not built. A small icon that only looks tappable would mislead; Edit profile does the job.
- **Teacher bio:** still Later. No page shows teachers to students yet.
- **The streak and the photo appear only on Profile, not in the header.** That was outside this chat's scope (Profile only).

### Outside Profile, changed because the owner's rule needed it

- The dashboard streak now counts a recording or a card answer (owner's practice-day rule, 29 Oct).
- `app/api/profile/preferences` checks the goal date.
- `app/api/me` exports the photo link and deletes the photo file.
- The Privacy page has the photo line and the new date. Testing in every phase: `tsc --noEmit`, `next build`, and Playwright at 390×844 and 1280×800 for student, new student, guest, teacher and admin. Also axe in all five themes, keyboard-only use of every sheet, and checks that no number leaks across users (every query is scoped by `userId`).

## Open questions for the owner

1. **Streak:** what counts as a practice day? Today the dashboard streak counts recordings only. The mockup counts a recording **or** a card answer. One definition everywhere is the recommendation, so the dashboard would change too (that is outside Profile, so only with approval).
2. **Photos:** who sees them? Recommended: only the owner (plus an admin removing a reported photo). That keeps the anonymous-ID rule and needs no approval queue. If teachers should see student photos, or students should see teacher photos, that needs a moderation queue like institute logos.
3. **Teacher quality checks (T4):** should teachers see QA notes on their own audits? Today only admins see them.
4. **Approval** of phases P1–P6 above.

## Master prompt (v1.0) for a new chat

The prompt the owner can paste into a new chat is kept here so it is not lost. It was given in chat on 29 Oct 2026.

> Read `CLAUDE.md` and `docs/PROJECT-MEMORY.md` first. If `docs/PROFILE-PLAN.md` exists, read it and continue from its "Next action".
> **Role:** product designer and engineer for EduSarthi's Profile page only.
> **Scope:** `/profile` (`app/(shared)/profile/page.tsx` and its components). Change nothing else except a link or a shared helper; list anything else in one line at the end.
> **Do not undo:** computed badges, English screens, the Settings phase M sheet pattern, honest copy, the anonymous STU ID for teachers. Photo upload is allowed since 29 Oct; who sees a photo is in this plan.
> **Steps:**
> 1. Ask before building, with options and a recommended one.
> 2. Research (Duolingo, ELSA, Speak, Praktika, Cambly, Preply, italki, Busuu, Memrise, Anki, Khan Academy, Coursera, LinkedIn Learning, TypeSarthi; Material 3, Apple HIG, WCAG 2.2), marking each finding CONFIRMED or UNVERIFIED, with links.
> 3. The list as a table: section, what it shows, data source, role, Must/Should/Later, why. Mark schema changes and what data could be lost.
> 4. Mockup in `docs/` with real tokens: PNGs at 390 and 1280, light and dark, empty and busy states.
> 5. Plan: numbered, one file per step, approval if more than 6 files, never two migrations in one step.
> 6. Build after approval and test (`tsc`, `next build`, Playwright, axe in five themes, keyboard).
> 7. Update this file and `PROJECT-MEMORY.md`, then push to the chat's `claude/` branch. No PR unless asked.
>
> **Output:** simple English, short sentences, tables for lists, a recommendation rather than a survey.

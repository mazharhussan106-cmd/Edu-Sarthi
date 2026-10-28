# Next features — plan (notifications, messages, profile, reminders, AI media, language, help bot)

Status: **Planned 28 Oct 2026 (branch `claude/adoring-gates-7h67av`). The owner answered Q1–Q9 the same day (see "Owner's decisions" at the end; they replace the PROPOSALs they cover). Phase A (notification inbox) is being built on the same branch.** Anything still marked **PROPOSAL** and not covered by a decision needs the owner's yes.

## The owner's list (28 Oct 2026)

1. A notification inbox with read and unread. Today there is only the Notices card.
2. Chat or messages with a teacher.
3. A profile photo.
4. Changing the phone number or email.
5. Each student chooses their own reminder time. Today everyone gets one fixed reminder at about 7 pm.
6. Photos or audio on AI cards.
7. The whole app in Hindi or Hinglish. **The owner has not decided this.**
8. A help chatbot.

## What exists today (checked in the code, 28 Oct)

| Feature | What exists | Where |
|---|---|---|
| Notifications | `Notice` (an admin posts one notice for everyone; no read state). Announcements create a `Notice` for 30 days. Personal events only go out by email: audit ready, deck approved/rejected/removed, deck invite, small fix undone, institute name removed, daily reminder. A recording that is sent back sends no email. | `lib/notices.ts`, `components/dashboard/NoticesCard.tsx`, `lib/notify.ts`, `lib/deckReview.ts`, `lib/deckMembers.ts`, `lib/smallFix.ts`, `lib/institutes.ts`, `app/api/cron/reminders/route.ts` |
| Teacher messages | None. Teachers see a student's ID (`STU-7K3Q9P`), never the name. The Help page says there is no live chat. | `User.publicId`, `app/(shared)/help/page.tsx` |
| Profile photo | None. Images already go to the private Supabase bucket through signed URLs. The institute logo flow (upload, check the first bytes, admin approval) is the closest pattern. | `lib/storage.ts`, `lib/instituteLogo.ts` |
| Change email / phone | Not possible. The Profile page says email editing was left out on purpose. The phone is optional at sign-up, unverified, unique, and not used for sign-in. There is no SMS provider. Google sign-in finds the account by email. | `app/(shared)/profile/page.tsx`, `app/api/register/route.ts`, `lib/auth.ts` (`userForProvenEmail`) |
| Reminder time | One Vercel cron a day at 13:30 UTC (7:00 pm IST). The same run also sends the day's announcement batch (at most 80). Email only, opt-in (`emailReminder`). | `vercel.json`, `app/api/cron/reminders/route.ts`, `lib/preferences.ts` |
| AI cards with media | AI cards are text only. Deck cards can already hold a picture and a recording, added by hand in the card editor. Deck cards have a speak button that uses the phone's own voice. | `lib/aiCards.ts`, `components/decks/MediaField.tsx`, `components/decks/DeckCardView.tsx` |
| Hindi / Hinglish | English UI. "Hide Hindi meanings" on cards. Decided: flashcards are always in English (6 Oct); announcements are English only (decision 26). | `lib/hindiToggle.ts`, `docs/PROJECT-MEMORY.md` |
| Help chatbot | A static FAQ on `/help`, a Support page with `support@edusarthi.com`. The AI key pattern (`lib/aiEnabled.ts`) hides AI features until the key is set. | `app/(shared)/help/page.tsx`, `app/(public)/support/page.tsx` |

## Suggested order (PROPOSAL)

Size: S ≈ days, M ≈ 1–2 weeks, L ≈ a month (same scale as `docs/ROADMAP-EARNING.md`).

| Phase | Feature | Size | Schema change (all additive, no data loss) | Needs first |
|---|---|---|---|---|
| A | Notification inbox | M | 2 new tables | — |
| B | Change email or phone | M | 1 new table | — |
| C | Profile photo | S | 1 nullable column | — |
| D | Reminder time | S | 1 nullable column | A (for the in-app copy) |
| E | Help chatbot | M | 1 new table (a count only) | `ANTHROPIC_API_KEY` |
| F | Photo or audio on AI cards | S (F1) | none for F1 | — |
| G | Messages with a teacher | L | 2 new tables | A, and the safety answers in Q8 |
| H | Hindi / Hinglish | S to L | none | The owner's decision (Q9) |

Why this order: the inbox is the base that messages, reminders and everything else post into. Email change is about account safety, so it comes early. Messages come late because they involve under-18s and need the most decisions. The language question is decided first and built last, because every screen built before it would have to be translated again.

Every phase touches more than 6 files, so each one is its own branch and pull request, built only after the owner approves its part of this plan. Each phase has at most one schema step. After each merge, run **Actions → Database setup** once.

---

## Phase A — Notification inbox

**What people see.** A bell in the header with the number of unread items ("9+" past nine). Tapping it opens `/notifications`: newest first, unread items with a dot and bold text, 20 per page. Tapping an item opens its page and marks it read. A "Mark all as read" button. Students, teachers and admins all get it (the page lives in the `(shared)` group).

**What creates a notification.**

| Event | Who gets it | Today |
|---|---|---|
| Audit ready | Student | Email (if switched on) |
| Recording sent back, with the reason | Student | **Nothing** — new |
| Deck approved, rejected or removed | Deck owner | Email |
| Invited to a deck (only when the account exists) | Invitee | Email |
| Small fix undone | Deck owner | Email |
| Institute name removed from a deck | Deck owner | Email |
| A recording assigned to this teacher's deck | Teacher | **Nothing** — new |
| Admin notices and announcements | Everyone | Dashboard card |
| New message (Phase G), daily reminder (Phase D) | Later phases | — |

**Data.**
- `Notification`: `id`, `userId`, `kind` (text, checked against an allowlist in `lib/notifications.ts`, like the preferences allowlist), `title`, `body`, `link`, `createdAt`, `readAt`. Index on `[userId, readAt, createdAt]`. Deleted with the account.
- `NoticeRead`: `userId`, `noticeId`, `readAt`, unique on the pair. Broadcast notices are **not** copied to each person (one notice for 10,000 students would be 10,000 rows); a row is written only when someone reads it.

**Rules.**
- Written after the real work has committed, and never throws (the same rule as `lib/notify.ts`), so a failed notification never turns a saved audit into an error.
- Text comes from our own templates. Deck titles are user text and are shown as plain text.
- `link` must be an internal path starting with `/`. Anything else is refused, so a notification can never send someone to another site.
- The unread count is read on each page load. No background polling on every page (slow phones, mobile data).
- Emails and their Settings switches stay as they are. The inbox is in addition.
- **PROPOSAL:** read items are deleted after 90 days and unread after 180 days, by the existing retention cron.
- The data export includes notifications.

**Files (about 12):** `prisma/schema.prisma`, `lib/notifications.ts`, `app/api/notifications/route.ts`, `app/(shared)/notifications/page.tsx`, `components/layout/NotificationBell.tsx`, `components/layout/StickyHeader.tsx`, the six places listed in the table, the retention cron, the data export (`app/api/me/route.ts`).

**Not in Phase A: push notifications to the phone.** The Android app is a TWA, which can show web push notifications. That needs VAPID keys, a `PushSubscription` table, and a careful "Allow notifications?" moment. **PROPOSAL:** a separate Phase A2 after A, if the owner wants it (Q2).

---

## Phase B — Change email or phone

**Changing the email (the address used to sign in).**
1. Settings → Account → "Change email". The person types the new address.
2. They prove it is them: their current password, or (for accounts without a password, such as Google or email-code sign-in) a code sent to the current address.
3. A 6-digit code goes to the new address: hashed, 10 minutes, 5 attempts, like the existing codes.
4. If the new address already belongs to an account, the screen says exactly the same thing, and that address gets an email "Someone tried to move an EduSarthi account to this address" instead of a code. The form never reveals who has an account (the same rule as deck invites).
5. With the right code, in one transaction: the new email, `emailVerified` = now, `sessionsValidFrom` = now (other devices are signed out), open reset links are burned.
6. After it commits: an email to the **old** address ("Your sign-in email was changed. Not you? Write to support@edusarthi.com") and a notification (Phase A).

**PROPOSAL limits:** 3 changes in 30 days; a 60-second wait between code requests (as in Forgot password).

**Things that will bite.**
- Google sign-in finds the account by email (`userForProvenEmail` in `lib/auth.ts`). After a change, "Continue with Google" with the **old** Gmail address would make a new, empty account. The screen must say so. The build chat must also check how the stored `Account` link (Auth.js adapter, `allowDangerousEmailAccountLinking`) behaves after the change.
- Deck invitations are by email. Check that invitations sent to the new address appear after the change.
- Guests have no email. For them "Change email" is "Create an account", which already exists.

**Data:** a new table `EmailChange` (`userId`, `newEmail`, `codeHash`, `expiresAt`, `attempts`, `consumedAt`), so the existing `VerificationCode` stays simple.

**The phone number.** It is optional, unverified and not used for anything.
- **PROPOSAL:** Settings shows it with Edit and Remove, labelled "Not verified. Not used to sign in. We do not send SMS." If the number is taken: "This number can't be saved. Check it, or leave it empty."
- A verified phone (a code by SMS) needs an SMS provider and DLT registration in India. That costs money and weeks of paperwork, and is only worth it for phone sign-in or SMS reminders.
- Under the DPDP Act, data we do not use should not be collected. If nothing will use the phone, we could stop asking for it at sign-up. The owner decides (Q3).

**Files (about 9):** schema, `lib/emailChange.ts`, `app/api/profile/email/start/route.ts`, `app/api/profile/email/confirm/route.ts`, `app/api/profile/phone/route.ts`, `components/student/EmailChangeForm.tsx`, `components/student/PhoneForm.tsx`, the Settings page, `lib/email.ts` (two new emails).

---

## Phase C — Profile photo

- **Upload:** PNG, JPG or WebP. The browser shrinks it to 256×256 WebP (about 20–40 KB) before uploading, so it is quick on mobile data. The server still checks the type from the first bytes and caps the size at 1 MB, because the browser step can be skipped.
- **Storage:** the same private bucket, key `avatars/<userId>/<random>`. It is read through a short-lived signed link, like every other file. The old file is deleted when the photo is replaced or removed, and when the account is deleted. The data export includes it.
- **No photo:** the person's initials in a circle (token colours only).
- **Who sees it — the main question (Q4).** Teachers see `STU-xxxx` instead of a name on purpose, so audits stay fair. **PROPOSAL:** a student's photo is seen only by the student (and an admin if needed); not by teachers, not on public decks. A teacher's photo could be shown to students on audits and messages, if the owner wants.
- If photos are shown to anyone else, they need an admin check first, like institute logos (many students are under 18). Seen only by the person: no check needed.
- **PROPOSAL:** the Google profile picture is not copied in automatically.
- **Data:** `User.avatarKey` (nullable).
- **Files (about 7):** schema, `lib/avatar.ts`, `app/api/profile/avatar/route.ts`, `components/student/AvatarForm.tsx`, `components/ui/Avatar.tsx`, the header, the Profile page.

---

## Phase D — Each student chooses the reminder time

**A hosting fact (Vercel docs, checked 28 Oct 2026):** on the Hobby plan, each cron job can run at most once a day, with hourly precision: a 7 pm job runs at some point between 7:00 and 7:59. Hobby allows up to 100 cron jobs. The Pro plan allows a job every minute. Sources: [Vercel cron usage and pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing).

**PROPOSAL.**
- Choose from fixed times, not any minute: 7 am, 9 am, 1 pm, 5 pm, 7 pm (the default, today's time), 9 pm IST.
- On Hobby: one cron entry per time in `vercel.json`, each calling `/api/cron/reminders?slot=19`. On Pro: a single hourly job.
- While on Hobby, Settings says "between 7 and 8 pm", not "at 7 pm".
- The time is stored as `preferences.reminderHour`, added to the allowlist in `lib/preferences.ts`. A missing value means 19, so nobody's reminder moves.
- **Double-send guard:** a new nullable column `User.reminderSentOn`. The cron claims each student with a conditional update ("not yet sent today") before sending, so two overlapping runs, or a time change on the same day, never send twice.
- **Important:** the announcement batch runs only in the 7 pm run. Otherwise six runs a day would send six times the 80-a-day limit.
- The reminder also goes into the inbox (Phase A). Push to the phone only with Phase A2.

**Files (about 5):** `vercel.json`, the reminders cron route (split it if it passes 250 lines), `lib/preferences.ts`, `app/(shared)/settings/SettingsForm.tsx`, schema.

---

## Phase E — Help chatbot

- **What it is:** an "Ask for help" box on `/help`. It answers questions about using EduSarthi, using only EduSarthi's own help text.
- **Knowledge:** one help file in the repo, started from the `/help` FAQ, the Support page and a short note for each feature. The FAQ page and the bot read the same file, so they cannot disagree. **New rule for future chats:** every new feature adds its help lines to that file.
- When the help text does not cover a question, the bot says so and points to support@edusarthi.com. It never invents an answer, a refund or a feature.
- **No account data in version 1.** The bot cannot see the person's cards, audits or details, so it cannot leak anyone's data. A later version could read a few safe facts (cards due, the status of the latest audit) through tools.
- **Model:** a small, cheap Claude model (Haiku class), changeable with an `AI_HELP_MODEL` variable, with the help text cached in the prompt. The build chat must check the current model names and prices before building.
- **Language:** it answers in the language the person writes in: English, Hindi or Hinglish. This gives Hindi help without translating the whole app (see Phase H).
- **Scope (Q6):** **PROPOSAL:** it answers app questions only. It does not teach English or do homework. An "ask an English doubt" mode is a different, costlier product.
- **Limits (PROPOSAL):** 20 questions a day for members, 5 for guests, 500 characters per question. The conversation is kept in the browser only (last 6 turns). The server keeps only a count row for the limit (like `AiDraftLog`).
- **Labels:** "AI help. It can make mistakes." and a "Talk to a person" link.
- **Safety:** the person's text is treated as data, not instructions. The bot never says it is a person.
- Hidden until `ANTHROPIC_API_KEY` is set (the `lib/aiEnabled.ts` pattern).
- **Privacy page:** a new use of an existing processor (Anthropic). The owner decides how to tell account holders, as with the AI card maker.
- **Files (about 8):** the help text file, `lib/aiHelp.ts`, `lib/aiHelpLimits.ts`, `app/api/help/ask/route.ts`, `components/help/HelpChat.tsx`, the Help page, the privacy page, schema (`AiHelpLog`).
- **Testing:** a fake model locally, then real keys from a laptop like `scripts/ai-smoke.ts`.

---

## Phase F — Photo or audio on AI cards

| Option | What | Cost | Recommendation |
|---|---|---|---|
| F1 | Add a photo or a recording to each AI card **before** "Add", reusing `MediaField`. Uploaded on Add, like the editor. | No AI cost | **PROPOSAL: build this first** |
| F2 | An AI voice records each card (text-to-speech), stored per card | Per card, plus storage | Not now: the speak button already reads cards aloud for free (quality depends on the phone) |
| F3 | AI-made pictures (an image model) | Per picture; slow | Later, maybe paid. If built: a "Make a picture" button per card (not inside the 10-card request, which would pass the time limit), its own free allowance, an "AI-made picture" label, and admin review as usual for public decks. The picture service's terms must allow CC BY-SA use. Pictures can be wrong or unsuitable for children. |
| F4 | A picture cut from the person's own uploaded source photo | Low | Skip unless asked. Sources are deleted after 24 hours, so the picture would have to be copied to the card. |

**Check before building:** decision 17 says "a recording on a deck card stays at a minimum of 15 seconds". If that covers card audio, a 2-second pronunciation clip would be refused. The owner should confirm (Q7).

**Files for F1 (about 5):** `components/decks/AiDraftList.tsx`, both AI add routes, `lib/aiCardRows.ts`, `lib/deckSchemas.ts`.

---

## Phase G — Messages with a teacher

**Why this needs care.** Many students are under 18. Teachers see `STU-xxxx`, not names, by design. Teachers are not paid in the system yet. Vercel functions cannot hold live connections.

**Who can message whom (Q8).**

| Option | What | Recommendation |
|---|---|---|
| G1 | "Ask about this audit": on an audited recording, the student asks the teacher who wrote it; the teacher replies. One thread per audit. The teacher still sees only `STU-xxxx`. | **PROPOSAL: start here** |
| G2 | Institute messages: students and teachers of the same institute; the institute's admin can see their institute's threads | Second, if institutes ask |
| G3 | Message any teacher | Not recommended: safety, spam, unpaid work |

**Safety (all options, PROPOSAL).**
- Text only in version 1: no files, no pictures.
- Phone numbers, emails, links and social media handles are blocked in messages, so contact stays on the platform. This protects minors.
- A Report button on each message, and Admin → Messages: the admin reads a reported thread (recorded in the admin log), hides a message, or suspends an account.
- Limits: 1,000 characters per message, 20 messages a day per student. The teacher can close a thread.
- A thread closes 14 days after the audit.
- The Terms and Privacy pages need a section (a lawyer still has to review them).

**Delivery.** It is called "Messages", not "Chat", so nobody expects an instant reply. An open thread refreshes every 20 seconds while it is on screen. Otherwise the person sees the inbox (Phase A), plus at most one email per thread every 6 hours (PROPOSAL).

**Data:** `Conversation` (`studentId`, `teacherId`, `submissionId` unique, `instituteId`, `lastMessageAt`, `closedAt`) and `Message` (`conversationId`, `senderId`, `body`, `readAt`, `hiddenAt`, `reportedAt`, `reportReason`). Every query is scoped to the two people in the thread.

**Retention (PROPOSAL):** messages are kept for 1 year, then deleted. They are in the data export. When an account is deleted, its messages show as "Deleted account".

**Teachers' time:** are teachers expected to reply, and does a reply count toward teacher earnings (`docs/ROADMAP-EARNING.md` item 3)? The owner decides.

**Size:** about 14 files. Build it as two pull requests: (1) data plus the student side, (2) the teacher side plus admin moderation.

---

## Phase H — Hindi / Hinglish (the owner decides first)

Already decided, and this does not change it: flashcards are always in English, and announcements are English only. This question is only about the app's own words: menus, buttons, messages, help and emails.

| Option | What students get | Work | Downside |
|---|---|---|---|
| H0 | English app, plus Hindi/Hinglish help from the chatbot (Phase E) | None beyond Phase E | Some students still get stuck on English screens |
| H1 | Bilingual hints: English stays, with a small Hindi line under key labels, errors and first-time screens (a switch in Settings) | M | More text on screen. But students keep reading English, which suits an English-learning app |
| H2 | A full Hindi (Devanagari) switch | L | Every page's text moves into dictionaries (hundreds of strings across about 200 `.tsx` files). Every future feature needs Hindi too. Needs a person to check the translations. The Devanagari font adds weight |
| H3 | A full Hinglish (Roman script) switch | L | Same work as H2. No fixed spelling. Easy to read for many students |
| H4 | Both H2 and H3 | L+ | Three versions of every sentence, forever |

**PROPOSAL:** H0 now (it comes with the chatbot). Add H1 on student pages if students ask for it. Do H2 only when a paying institute needs it. Legal pages stay in English as the binding version.

**If H1–H4 is chosen:** a language cookie like text size (`data-lang` on `<html>`, read by server components); dictionaries in `lib/i18n/`; a `t()` helper; TypeScript checks that every key exists in every language; emails in the person's language; teacher and admin screens stay English. Read the Next 16 docs before picking a library.

---

## Questions for the owner (all open)

| # | Question | Assistant's suggestion |
|---|---|---|
| Q1 | Is the order A → B → C → D → E → F → G (H decided now, built last) right? | Yes |
| Q2 | Notifications: delete read items after 90 days and unread after 180? Push notifications to the phone later (Phase A2)? | Yes; A2 after A |
| Q3 | Email change: sign out other devices, at most 3 changes in 30 days? Phone: (a) unverified Edit/Remove, (b) verify by SMS (cost, DLT paperwork), or (c) stop asking for it? | Yes; (a), and think about (c) |
| Q4 | Who sees a student's photo: only the student, teachers too, or everyone? Show teachers' photos to students? | Only the student; teachers' photos optional |
| Q5 | Reminder times: 7 am, 9 am, 1 pm, 5 pm, 7 pm, 9 pm? On Hobby, show "between 7 and 8 pm", or move to Pro for exact times? | These times; Hobby wording until Pro |
| Q6 | Help bot: 20 a day for members, 5 for guests? App help only, or English questions too? | Yes; app help only |
| Q7 | AI cards: F1 now, AI pictures (F3) later as a paid extra? Does the 15-second minimum apply to audio on a card? | F1 now; F3 later |
| Q8 | Messages: G1, G2 or G3? Block phone numbers, emails and links? Keep messages 1 year? Are teachers expected to reply, and is it paid? | G1; block; 1 year; owner decides |
| Q9 | Language: H0, H1, H2, H3 or H4? | H0 now, H1 if asked |

## Owner's decisions

### First round (28 Oct 2026) — CONFIRMED

| # | Topic | Decision | Replaces |
|---|---|---|---|
| N1 | Teachers and student names | Teachers keep seeing only the student ID (`STU-xxxx`), in messages and everywhere else. | — (confirms how it works today) |
| N2 | Google sign-in after an email change | "Continue with Google" with the old Gmail address must still open the same account, not make a new one. Phase B has to tie a Google sign-in to the account itself, not only to the email. | The plan's "the screen must say so" |
| N3 | Phone number | The phone field stays. It will be used later (how is not decided). For now: edit or remove, unverified. | Q3 options (b) and (c) |
| N4 | Hosting | The owner will move to Vercel Pro when student sign-ups start. | — |
| N5 | Announcements | Sent only in the 7 pm reminder run. | — |
| N6 | Order (Q1) | A → B → C → D → E → G, then H. | — |
| N7 | Notifications (Q2) | Read items deleted after 90 days, unread after 180. Push notifications to the phone (Phase A2) come after Phase A. | — |
| N8 | Email change (Q3) | Other devices are signed out; at most 3 changes in 30 days. | — |
| N9 | Photos (Q4) | A student's photo is seen only by the student. A teacher's photo is shown to students. | — |
| N10 | Reminder time (Q5) | The student chooses any time, to the minute. This needs Pro (a cron every minute), so Phase D waits for the move to Pro. | The fixed slots in Phase D |
| N11 | Help bot (Q6) | 20 questions a day for members, 5 for guests. App help only, no English teaching. | — |
| N12 | AI card media (Q7) | **Skipped for now.** Phase F is not built. | — |
| N13 | Messages (Q8) | G1 ("Ask about this audit"). Phone numbers, emails and links are blocked. Messages are kept 1 year. Teachers must reply. Replies are not paid. | — |
| N14 | Language (Q9) | Settings gets a language option. For now it offers English only; the owner adds languages later. | Options H0–H4 |

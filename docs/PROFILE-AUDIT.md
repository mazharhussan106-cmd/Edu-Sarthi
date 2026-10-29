# Profile page audit (29 Oct 2026)

Audit of everything built for the Profile page in the chat on branch `claude/busy-johnson-epz1lg` (commits `93a67e0` to `2fa696c`): what was built against the plan in `docs/PROFILE-PLAN.md`, how it was checked, what is wrong or risky, and what is left.

**Status (29 Oct, same day):** the owner chose to fix every finding that can be fixed off the live site, and decided F1 (see below). Done: F1, F2, F3, F6, F7, F8, F9 (`streakDays`), F11, F12 and F13. Left for the live site: F4, F5 and F10. The "Fixed" column in section 3 says how each was fixed and tested.

**Merge with `main` (29 Oct, later):** `main` brought in the dashboard redesign (PR #27), which changed the same streak and badge code, so PR #28 had a merge conflict. It was resolved toward the dashboard's rules (`docs/PROFILE-PLAN.md` → "Merge with the dashboard redesign"). F9 is now moot: `lib/progress.ts` is gone from `main` altogether. The header now shows the streak (the dashboard PR built it), so that item in section 4 is done.

## 1. Built against the plan

Every row of the plan's list is built, except the three marked Later or "not built, on purpose".

| Role | Rows | Built | Not built |
|---|---|---|---|
| Student | S1 identity, S2 tiles, S3 goal + date, S4 speaking scores, S5 calendar, S6 badges (12), S7 my content, S8 shortcuts, S9 account and privacy, S10 get started, S11 share card, guest variant | All | The camera icon on the avatar (mockup only): a small icon that only looks tappable would mislead |
| Teacher | T1 identity + verified, T2 tiles, T3 calendar, T4 QA notes, T5 decks, T6 shortcuts, T7 account | All | Bio (Later: no page shows teachers to students yet) |
| Admin | A1 identity, A2 tiles, A3 recent actions, A4 calendar, A5 shortcuts, A6 account | All | — |

Changes outside Profile, each needed by an owner decision:
- the dashboard streak (practice-day rule);
- the preferences route (goal date check);
- `/api/me` (photo in the export, photo deleted with the account);
- the Privacy page (photo line, new date);
- the schema (`User.avatarKey`).

## 2. How it was checked

- **Browser tests:** six Playwright suites against a local Postgres with test accounts (student, new student, guest, teacher, admin), at 390, 820 and 1280 px. All pass. One check in the photo suite assumed "no photo yet" and failed only because another suite had added one.
- **Accessibility:** axe (WCAG 2.1 AA and best practice) in all five themes for the student, teacher and admin profiles, and on the sheets. Only the known logotype contrast is left (every page has it).
- **Numbers:** checked against hand counts of the test data. The queue count matches the Queue page, and the turnaround matches Workload over 30 days.
- **Privacy:** the "Who sees what" claims were checked in the code.
  - Teacher pages select only the student's `publicId`, and no student page selects a teacher's identity.
  - An institute's admin does see members' names and emails, and the sheet says so.
  - The photo's storage key appears on no teacher or admin page.
- **Build:** `tsc --noEmit` and `next build` pass after every phase.

### CLAUDE.md rules

| Rule | State |
|---|---|
| 1 Server components by default | Yes. Client only for sheets, the cropper, the share card and the goal editor |
| 2 No hardcoded colours | Yes, except two documented cases: the share picture's brand colours (a PNG cannot follow a theme, the same as `app/manifest.ts`) and a `"gray"` fallback in the cropper (see F8) |
| 4 Header comment on every file | Yes, all new files |
| 5 Zod at the boundary | Yes: avatar route, goal date (same check in browser and server), name and number |
| 6 Queries scoped by user | Yes, every query uses `userId`. The only site-wide counts are the admin's "decks waiting" and "logos waiting", by design |
| 7 `revalidate = 0` | Yes, `/profile` |
| 8 Defensive parsing | Yes: no bare `res.json()` |
| 11 Files under ~250 lines | **No for one file:** `PhotoEditor.tsx` is 270 (F7). `privacy/page.tsx` was already over (277 before, 285 now) |
| 12 Errors say what to do next | Yes |
| 13 Accessibility | **One bug:** focus is lost in the photo step (F2) |
| 15 Honest copy | **One overclaim:** "Download my data" for teachers and admins (F3) |

## 3. Findings, most important first

| # | Severity | Finding | Fix | Fixed |
|---|---|---|---|---|
| F1 | **High (trust)** | Teachers now see the QA notes admins leave on their audits (owner's decision). The admin's "Flag for QA" form does not say so, and the Profile shows notes from the last 90 days, written when only admins could read them. | Say on the flag form: "The teacher sees this note on their Profile." **Owner to decide:** show old notes too, or only notes written from the release date. | **Yes.** Owner, 29 Oct: teachers see **all** QA notes from the last 90 days. The Dispatch "Flag for QA" form now says under the reason: "The teacher who wrote this audit sees this note on their Profile." (`ActionButton` got a `reasonHint`.) Tested in `p4-staff`. |
| F2 | Medium (accessibility bug) | After choosing a photo, focus jumps to the sheet's Close button; after "Use photo" it is lost to the page. Keyboard and screen-reader users lose their place. Confirmed in a browser test. | Move focus to the crop area when it opens, and back to "Change photo" after Use photo or Back. | **Yes.** Focus goes to the crop area when it opens, and back to the photo button after Use photo, Back or Remove. Tested in `p5-photo`. |
| F3 | Medium (honest copy) | Teachers' and admins' "Download my data" row says "Everything stored about this account", but the export (`/api/me`) is built for students: it leaves out the audits a teacher wrote. | Say "Your account details, as a file" for staff, or add the teacher's audits to the export. | **Yes.** For teachers and admins the row now reads "Your account details and settings, as a file". Adding their audits to the export is left for later. Tested in `p1` and `p4`. |
| F4 | Medium (untested) | The photo upload and the share picture with a photo were tested only with the local file store, never with the real Supabase bucket: the signed upload (PUT), and CORS on the signed read URL that the share picture needs. The share sheet falls back without the photo if that fails. | Test on the live site after merging (section 5). | No: needs the live site. In `LIVE-TESTING-GUIDE.md` 4e. |
| F5 | Medium (before going live) | `User.avatarKey` must exist on the live database before this code runs, or `/profile` fails. The Privacy page promises an email before a change in what is collected. | After merging: Actions → Database setup at once, then the announcement email. | No: owner's step. In `LIVE-TESTING-GUIDE.md` 4e. |
| F6 | Low (hardening) | After issuing the signed URL, the server trusts the browser for the file's size and type. Only the owner ever sees the photo, so the risk is storage use, not harm to others. | In `setAvatar`, read the stored object's size and type and refuse anything over about 600 KB or not an image. | **Yes.** New `objectInfo` in `lib/storage.ts`. `setAvatar` refuses a file that is empty, over 600 KB, or not WebP or JPEG, and deletes it. If the store cannot say ("unknown"), the file is let through, so saves never break. Tested in `p5-photo` (a 900 KB file is refused and deleted). |
| F7 | Low (rule 11) | `components/profile/PhotoEditor.tsx` is 270 lines. | Split the crop step into `PhotoCropper.tsx`. | **Yes.** `PhotoCropper.tsx` (about 175 lines) and `PhotoEditor.tsx` (about 155). |
| F8 | Low | Closing the sheet in the middle of a crop does not release the picked image's memory (object URL); a cancelled touch (`pointercancel`) is not handled; two `"gray"` colour fallbacks. | Clean-up effect, `onPointerCancel`, drop the fallbacks. | **Yes**, all three. |
| F9 | Low (dead code) | `streakDays` in `lib/progress.ts` is no longer used (this chat). `studyDates` in `lib/history.ts` was unused before this chat. | Remove `streakDays`; `studyDates` is the owner's call (outside Profile). | **Yes** for `streakDays`. `studyDates` left as it was. |
| F10 | Low (watch) | One student Profile view makes about 15 database queries plus one storage call. On the live pooler, with one connection per request, they run one after another. | Measure on the live site; if slow, fold the counts into one SQL query. | No: measure live first. |
| F11 | Process | The six browser test suites live only in this session's scratch folder and are lost when the session ends. | Commit them under `scripts/profile-e2e/` with a short README, so the next chat can rerun them. | **Yes.** `scripts/profile-e2e/`: six suites, a seed that resets the test accounts before each suite, `run.cjs` and a README. All six pass. |
| F12 | Docs | `LIVE-TESTING-GUIDE.md` has no Profile section for the owner's phone test. | Add the Profile section (the checklist in section 5). | **Yes.** `LIVE-TESTING-GUIDE.md` 4e (it was 4d until the dashboard's own 4d arrived from `main`), in the guide's own language. |
| F13 | Small UX | "Set your goal" in Get started scrolls to the goal card but does not open its sheet (one extra tap). A QA note does not say which audit it is about. | Open the sheet from the link; show the exercise title and date with each note. | **Yes.** "Set" opens the goal sheet (plain link plus a hash listener, closing drops the hash). Each QA note shows the exercise and the day it was sent. Tested in `p1` and `p4`. |

Pre-existing, not from this chat:
- the logotype contrast and the header's unlabelled navs (every page);
- orphan uploads when a save fails after the file is sent (owner's backlog, item 4);
- the Privacy page is over 250 lines.

## 4. Left to build (not in this chat's approved scope)

- Teacher bio, once a page shows teachers to students.
- The photo in the header or bottom bar (the scope was the Profile page only). The streak is in the header now, from the dashboard PR.
- Certificates or a public profile: ideas only, never asked for.

## 5. Live test after merging (for `LIVE-TESTING-GUIDE.md`)

1. Merge, then **Actions → Database setup**. Open `/profile` as a student: it loads.
2. Edit profile → Add a photo from the phone gallery → move and zoom → Use photo. The photo shows. Reload: it is still there.
3. Share progress → switch Photo on. The preview shows the photo (this checks CORS). Share → WhatsApp works; Download saves a PNG.
4. Remove the photo: the initials come back.
5. Goal: set a date and check "N days left".
6. Teacher account: tiles, calendar, quality notes; "N waiting" matches the Queue.
7. Admin account: recent actions read in words.
8. Send the privacy-change email from Admin → Announcements.

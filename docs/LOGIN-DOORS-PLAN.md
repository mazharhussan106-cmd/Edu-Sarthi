# Separate sign-in doors for student, teacher and admin — plan

Status: **BUILT and tested, not merged (30 Oct 2026, branch `claude/login-doors`).** The owner answered the three questions the same day; see "Owner's answers" and "What was built" at the end.

## Where this comes from

- 10 Oct: branch `claude/adoring-darwin-ay4wox` (one commit, `f49b9c3`) added `/student/login`, `/teacher/login` and `/admin/login`. It was never merged and was never tested against a real database.
- 11 Oct onwards, `main` changed sign-in a lot: **Continue with Google**, **Continue as guest**, the email code and one-tap link, the guest-to-account upgrade, the fix for Google landing in a guest (28 Oct), and the public library with sign-in links on its pages. 190 commits came after that branch's base.
- 30 Oct: the owner chose to **build the doors again on today's `main`**, not to merge the old branch. The old branch stays as a record and is not to be merged.

## What the old branch did (kept as the starting idea)

- Three pages, each with its own heading and look, sharing one form.
- The server refuses a role the door does not admit. A student at the teacher door is told to use the student door, and the other way round.
- **The admin door never names itself.** Someone who is not an admin gets "wrong email or password", and the attempt counts against that address like a wrong password.
- Only the student door can create an account. The teacher and admin doors admit existing accounts only, and send no email code to an address that cannot use that door.
- `/admin/login` is `noindex` and linked from nowhere. The branch says so plainly: this hides the page, it does not protect it. The real protection is the role check and `proxy.ts`, which stay as they are.

## What is different today, and needs a decision

| Today on `main` | Why it matters for doors |
|---|---|
| **Continue with Google** on `/login` and `/register` | Google sign-in goes away to Google and comes back. Knowing which door it started from needs a cookie or the return address. |
| **Continue as guest** | A guest is always a student. |
| **Email code and one-tap link** (`/login/link`) | The emailed link must open the right door. |
| A guest may open `/login` and `/register` to upgrade | That rule lives in `proxy.ts` and must keep working. |
| 28 places link to `/login` (library pages, emails, redirects in `proxy.ts`) | Changing the address of the student door would touch all of them. |

## Proposal (what I would build if the owner agrees)

1. **`/login` stays the student door** (heading "Student sign in"), with Google, guest, email code and password, as today. No old link breaks.
2. **New `/teacher/login`**: password and email code only; existing accounts only; a student is told to use `/login`.
3. **New `/admin/login`**: password and email code only; existing admin accounts only; not linked anywhere; `noindex`; a non-admin gets the same reply as a wrong password, and the attempt counts.
4. **At the student door**, a teacher or admin who signs in is **let in as today** and shown a one-line note that teachers have their own page. This avoids breaking anyone's habit, and Google stays simple. (The old branch refused them; see question 2.)
5. One shared form component, so the three doors cannot drift apart; the role check in `lib/auth.ts`, reusing the old branch's `checkPortal` idea; door wording in one file (`lib/portals.ts`).
6. A link "Are you a teacher? Sign in here" at the foot of the student door (question 3).

**About 12 files:** `lib/portals.ts` (new), `lib/auth.ts`, `lib/validations.ts`, `app/api/auth/email-login/route.ts`, `app/(auth)/login/page.tsx`, `app/(auth)/login/link/page.tsx`, `app/(portal)/teacher/login/page.tsx` (new), `app/(portal)/admin/login/page.tsx` (new), `components/auth/PortalLogin.tsx` (new, the shared form), `components/auth/PortalShell.tsx` (new, the per-door look), `proxy.ts`, `docs/PROJECT-MEMORY.md`. **No schema change.**

**Testing before any merge:** local Postgres and a production build, browser at phone and computer width: every door × every role × password, code and link; admin door gives nothing away; guests and Google untouched at `/login`; the guest upgrade still works; the 28 `/login` links still land on the student door; no page errors. Google itself cannot be tested without real keys.

## Questions for the owner

1. **Google and guest:** only on the student door (recommended), or also on the teacher door?
2. **A teacher or admin at the student door:** let them in with a note (recommended), or refuse and send them to their own door like the old branch?
3. **Link to the teacher door:** a small link on the student door (recommended), or no link (teachers are given the address)?

## Owner's answers (30 Oct 2026)

1. Google and guest: **only on the student door.**
2. A teacher or admin at the student door: **let in, with a note.**
3. A link to the teacher door on the student page: **no.** So the note is where staff learn their address: it shows once, after they sign in at `/login`, on their own page (a teacher sees `/teacher/login`, an admin sees `/admin/login`; nobody else sees either).

Decided while building (say if wrong): an **admin may use the teacher door** (admins can do everything a teacher can); a student at the teacher door is told to use the main sign-in page.

## What was built

- `lib/portals.ts`: the three doors, addresses, wording, error messages (no database imports).
- `lib/doorAuth.ts`: who each door admits; the admin door's refusal is the same code as a wrong password or code and counts as a failed attempt; staff doors never create an account and email a code only to an account they admit (same reply either way).
- `lib/auth.ts`: password, email code and one-tap link all check the door after the credential is proven. `lib/validations.ts`: `portal` on the four sign-in schemas (missing = student door).
- `app/api/auth/email-login/route.ts`: staff doors send nothing to an address they do not admit; the link carries `&portal=` for staff doors.
- `components/auth/PortalLogin.tsx` (shared form) and `CodeSignIn.tsx` (the code half; the old 288-line login page is split in two). `/login` (`app/(auth)/login/page.tsx`), `/teacher/login`, `/admin/login` (noindex, linked from nowhere).
- `components/auth/DoorNote.tsx` + `DoorNoteLine.tsx` + `doorCookie.ts`: the one-time note in the teacher and admin layouts, from a cookie the student door sets just before signing in (including Google); the cookie is cleared when the note shows.
- `proxy.ts`: staff doors reachable signed out; signed-in people sent home from them like from `/login`; a signed-out visit to a teacher page goes to `/teacher/login`, to an admin page still to `/login`.
- **No schema change.**

**Tested** (local Postgres; production build compiles; browser checks on the dev server, which prints emails so codes can be read; 390 px): 26 checks. Each door's page and what it hides; signed-out redirects (`/queue` → teacher door, `/admin` → `/login`); student at teacher door told where to go; teacher and student at admin door get "Email or password is not correct." and both count as failed attempts; teacher, admin at the right doors land home with no note; signed-in teacher on `/teacher/login` sent home; teacher and admin at `/login` land home with the note naming their own door, shown once; student at `/login` no note; teacher door sends no code to a student, admin door none to an unknown address and makes no account; teacher signs in by code and by one-tap link at the teacher door; a student's code typed at the teacher door is refused; `/login` code still creates a new student; guest still works. **Not tested:** Google (needs real keys); the live database.

**To go live:** merge; nothing to run on the database.

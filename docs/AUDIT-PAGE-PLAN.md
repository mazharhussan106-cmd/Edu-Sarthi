# Student audit page — improvement plan

Status: **BUILT and tested locally (29 Oct 2026). Not merged, not tested on the live site.** See "Build result" at the end.
Branch: `claude/epic-galileo-nvgutk`. Started 29 Oct 2026.

Scope (owner, 29 Oct): this chat improves **only** the student's finished-audit
page, `/feedback/[id]` (`app/(student)/feedback/[id]/page.tsx`,
`components/student/AuditReport.tsx`). No other page or feature changes.

## Owner's answers (29 Oct)

| # | Question | Answer |
|---|---|---|
| 1 | Which page | **A** — the student's finished audit, `/feedback/[id]` |
| 2 | Biggest gap | **A + C** — the student cannot tell what to fix next; progress and motivation are not shown |
| 3 | Data | **A** — only data that exists today. No database change, no change to the teacher's page |
| 4 | Top of the page | **A** — overall score, one line from the teacher, the top 3 things to fix |
| 5 | Scores | **B** — 0–10 plus a band word, and each skill's change since the last audit |
| 6 | Actions | **A** — only "Try again", placed better |

## What the page shows today (top to bottom)

Overall /10 with "+0.8 since your last audit" → sticky player → "Where to
improve" timestamped notes (minor/major) → five score bars → "What your teacher
said" → "Try this exercise again".

Found while planning:
- "Try again" on a **flashcard recording** opens the exercise without the card
  (`/practice/<exercise>` with no `?word=`), so the student loses the card.
  Built-in cards need `?word=<code>`; deck cards need
  `/library/<deckId>/practice/<wordId>`.
- **Photo audits have no notes** (`needsNotes` is false for `IMAGE` in
  `RubricForm.tsx`), so "top 3 fixes" will be empty for them.
- There is no `loading.tsx` for this route.
- Teachers see no definition of the five skills; the labels are just names.

## Research: what other products show (29 Oct)

The pages themselves could not be opened from the cloud session (its network
blocks these domains); the details below come from web-search summaries. Yoodli's
come from third-party reviews. Preply could not be confirmed and was dropped.

| Product | What its feedback shows | What we take / leave |
|---|---|---|
| [ELSA Speak — Speech Analyzer](https://www.isca-archive.org/slate_2023/anguera23_slate.html) | Separate pronunciation, fluency, grammar, vocabulary scores; points to the sounds that went wrong; predicts an exam score | Take: a score per skill. Leave: exam prediction |
| [Speechace](https://api-docs.speechace.com/api-reference/score-speech-open-ended/per-metric-feedback) ([word scores](https://api-docs.speechace.com/api-reference/score-text-pronunciation/handling-word-scores)) | 0–100 colour per word, pace/pauses/hesitations, a feedback line per metric, IELTS/PTE/CEFR mapping | Take: a short meaning beside each score. Leave: word colouring (no data), CEFR |
| [PowerPoint Speaker Coach](https://support.microsoft.com/en-us/office/rehearse-your-slide-show-with-speaker-coach-cd7fc941-5c3b-498c-a225-83ef3f64f07b) | Rehearsal Report: observations and suggestions, pace graph, filler words, a "Rehearse again" button | Take: a clear "do it again" at the point of action |
| [Yoodli](https://www.toastmasters.org/about/partnerships/yoodli) | Post-session analytics (fillers, pace), progress tracking, drills | Take: progress over time |
| [Cambly](https://support.cambly.com/hc/en-us/articles/43636308572813-Specific-Feedback-That-Drives-Progress) | Tutor's notes kept in lesson history, corrections typed so they can be re-read, advice that feedback be specific | Take: specific notes worth re-reading before the next try |
| [italki — Lesson Summary](https://support.italki.com/hc/en-us/articles/54381185537945) | Vocabulary and grammar from the lesson; Plus adds "mistakes and how to fix them"; practice built from the summary | Take: mistake → fix → practise, in that order |
| [Duolingo English Test — subscores](https://blog.englishtest.duolingo.com/det-subscores) | Overall plus subscores, so you can see which skill needs work | Take: overall plus breakdown, weakest skill called out |
| [Turnitin Feedback Studio](https://help.turnitin.com/feedback-studio/lti/student/paper-feedback/viewing-your-feedback.htm) | Grade at the top, rubric scorecard, comments pinned to the spot in the work, voice comments | Take: score first, notes tied to their moment (our timestamps) |
| Reference: [IELTS Speaking band descriptors](https://ielts.org/cdn/ielts-downloadable-assets/ielts-guidance-and-support/ielts-guides/ielts-speaking-band-descriptors.pdf) | A public description for each band of each criterion | Take: a word for each band. Leave: band numbers |

Common pattern: result first → skill breakdown with meaning → specific
mistakes tied to the moment → one clear next step → progress over time.

## What to show

**Must**
1. Overall score with band word and change since last ("6.4/10 · Good, ▲ +0.8"). Answers 4A, 5B.
2. One line from the teacher at the top (first sentence of the summary, cut at a word, "Read all ↓"). If the summary is one sentence, it is not repeated below. Answers 4A.
3. "Fix these first": up to 3 notes, major before minor, then by time; each time plays that moment. Answers 2A, 4A.
4. "Try this again" straight after the top 3, and again at the end. Answers 6A.
5. "Try again" on a card recording returns to that card (bug above).
6. Each skill: score, band word, one-line meaning, change since the last audit (▲ +1 / ▼ −1 / same; symbol and colour, never colour alone). Answers 5B, 2C.
7. Sticky player kept; pressing a time in the top card brings the player into view and plays.
8. All notes listed when there are more than 3 (no duplicate list when 3 or fewer).
9. The teacher's full summary, line breaks kept.
10. Correct with: first audit, photo audit (no notes), deleted recording, video.

**Should**
11. "Focus next: <lowest skill>" and "Strongest: <highest skill>" (ties named together). Answers 2A, 2C.
12. Progress strip: "Audit 4 · last 5: 5.2 → 5.6 → 6.4" as a small inline SVG (no chart library, light on phones). One extra query.
13. "What you were asked" — the exercise prompt, folded.
14. `loading.tsx` skeleton for slow phones (CLAUDE.md rule 14).

**Nice-to-have (later, on request)**
15. "N audits left today" beside Try again (reads the existing limit).
16. "Your best score so far" when it is.

**Do not show**
- CEFR / IELTS / exam-score estimate: the rubric is not validated against them; it would be an overclaim (CLAUDE.md rule 15).
- An "AI" label: owner's decision of 26 Oct (no AI label on student feedback).
- The transcript: not chosen (3A); exists only when a teacher used the AI draft, and Whisper tidies mistakes.
- Word/sound colouring, pace, filler counts: no such data; would need automatic scoring.
- Comparison with other students, rank, percentile: privacy, demotivating, no norm data.
- Notes tied to a skill, corrected sentence, per-skill comment: need new teacher fields (3B not chosen).
- Reply to teacher, PDF, saving a note: not chosen (6A).
- Generic praise or celebration not backed by the scores.

## Layouts considered

1. **Report card** — one column, result first. Same on computer, centred.
2. **Tabs** — score on top, then tabs (Fix first / Notes / Skills / Teacher). Shorter page, but content hides behind taps and needs more client code.
3. **Report card on phone, two panes on computer** — phone exactly as 1; at ≥1024px the report is on the left and the sticky player with all notes on the right, so a time pressed anywhere plays in a player that is always visible. DOM order stays the phone order (screen readers read the report first).

**Recommended: 3.** Nothing hidden on the phone; on a computer the player never leaves the screen; it is the same components with a CSS grid, so little extra cost.

## Build plan (after approval)

1. `lib/auditReport.ts` (new, no Prisma): skill meanings, `bandFor`, `topFixes`, `firstSentence`, `skillChanges`, focus/strongest.
2. `components/student/AuditSeek.tsx` (new, client): shared seek — provider, sticky player, note list wired to it. Reuses `NoteList` and `Player` unchanged.
3. `components/student/AuditSkills.tsx` (new, server): skill rows and the focus/strongest line.
4. `components/student/AuditProgress.tsx` (new, server): progress strip.
5. `components/student/AuditReport.tsx` (rewritten): hero, top 3, Try again, the layout grid.
6. `app/(student)/feedback/[id]/page.tsx` (edited): previous audit's five scores (already fetched), one query for the last 5 overall scores and the audit number, the card's code/deck for Try again, the exercise prompt.
7. `app/(student)/feedback/[id]/loading.tsx` (new).
8. `components/review/AuditPlayback.tsx` (deleted; only this page used it).

Not touched: the teacher's page, `NoteList`, `Player`, My Audits, the dashboard, the database (no migration, so no data can be lost).

Tests: local Postgres + Playwright at 390×844 and 1280×800 — first audit, 1/3/7 notes, all minor, photo, deleted file, video, long summary, tied skills, both Try again links; axe in all five themes; keyboard; `tsc` and `next build`.

## Open questions for the owner

- Approve layout 3?
- Band words and cut-offs (proposal): 0–3 Needs work · 4–5 Developing · 6–7 Good · 8–10 Strong.
- Skill meaning lines (proposal; teachers do not see these, so they should agree with how teachers score):
  Pronunciation — how clearly your sounds and word stress come across ·
  Grammar — how correctly you build sentences ·
  Fluency — how smoothly you speak, without long pauses or restarts ·
  Vocabulary — how well your words fit what you mean ·
  Confidence — how steadily and clearly you deliver.
- Build Must + Should now and leave Nice-to-have for later?

## Build result (29 Oct 2026)

The owner said "start building" without answering the open questions above, so
the proposals were built as written: layout 3, the four bands, the five meaning
lines, Must + Should. Change any of them in `lib/auditReport.ts` (one place).

Built (no database change, no Database setup run needed):
- `lib/auditReport.ts` — skills and meanings, `bandFor`, `topFixes`, `openingLine`, `skillRows`, `focusAndStrength`, `retryHref`.
- `components/student/AuditSeek.tsx` — client: shared seek, sticky player, note lists. A time pressed above the player scrolls it into view first.
- `components/student/AuditSkills.tsx`, `components/student/AuditProgress.tsx` — server.
- `components/student/AuditReport.tsx` — rewritten; `app/(student)/feedback/[id]/page.tsx` — one query for this audit and the four before it (replaces the old "previous audit" query) plus a count for "Audit N"; the page is `lg:max-w-6xl` only for a finished audit.
- `components/review/AuditPlayback.tsx` deleted (only this page used it). `NoteList` and `Player` unchanged.
- Dropped from the plan: a page-specific `loading.tsx`. `app/(student)/loading.tsx` already covers every student page.

Tested on a local Postgres with a production build and Playwright (60 checks):
first audit, 2 / 4 / 7 notes, photo with no notes, deleted recording, video,
long summary, equal scores, built-in card retry link (opens the card), keyboard,
a time in the top card plays at that moment with the player in view, the
computer layout (player column on the right, still on screen at the end of the
report), no sideways scroll at 390 and 1280, another student gets "not found"
with no data. axe (WCAG 2.1 AA): clean in dark, sepia, midnight and high
contrast. In light, only pre-existing shared items remain: the wordmark, and
`Badge`'s success ("Completed") and error ("major") tints at about 4.3:1.
Those badges are used site-wide, so they were left for a separate fix.
`tsc` and `next build` pass. The deck-card retry link was checked by the rule
only, not opened in a browser.

Still open:
- Owner to confirm or change the band words/cut-offs and the meaning lines.
- Light-theme contrast of `Badge` success/error (site-wide; outside this page).
- The not-found page for another student's audit returns HTTP 200, because the
  group's `loading.tsx` streams first. No data shows. Pre-existing.

## Phase 2: the two nice-to-haves (29 Oct 2026)

The owner said "start building next phase"; the plan's only items left were the two nice-to-haves. No database change.

- **Audits left today** under both "Try this again": "1 of 2 recordings for audit left today.", or at the limit "Today's 2 recordings for audit are sent. Practise aloud today; send the next one tomorrow…". It reads `auditAllowance` (`lib/auditLimit.ts`), the same count the practice page's `AuditGate` shows, so the two never disagree. The button still works at the limit: practising is allowed, and the practice page shows the limit card.
- **Best score so far**: "★ Your best score so far" in the overall card when this audit's five-score sum is higher than every earlier audit's; "★ Equals your best score so far" on a tie. Never on a first audit (that would be empty praise). Compared on the integer sum, so rounding cannot fake a best. One raw SQL query (`MAX` of the sum, scoped by `studentId`, excluding this audit), because Prisma's aggregate cannot sum columns.
- Rules in `lib/auditReport.ts` (`bestStatus`, `allowanceLine`).

Tested (same local setup, production build): best/equal/none across 7 audits in date order, a first audit with no star, the line under both buttons, a student at the limit, plus the 60 earlier checks again — 69 passed. `tsc` and `next build` pass.

Nothing from the plan is left to build. Still open: the owner's confirmation of the band words and meaning lines, and the pre-existing not-found status 200 (Badge contrast: fixed in phase 3).

## Phase 3: badge contrast (29 Oct 2026)

Owner chose "Badge contrast fix" as the next phase. Cause: in light, `--color-success` (#1a7f45) and `--color-error` (#c73a3a) were about 4.3:1 as 12px text on Badge's own tint, short of 4.5:1 (success was 4.3:1 even plain on paper-dim). Lowering the tint instead would have needed about 4% to pass, which leaves the pill barely visible, so the colours were darkened, as phase L did for sepia success.

Changed (`app/globals.css` only; Badge itself is unchanged):
- Light: success #1a7f45 → #156f3c, error #c73a3a → #b02f2f. Worst case on paper, surface and paper-dim, tinted: 4.74 and 4.52.
- Sepia: error #b03a2e → #a5352a (was 4.31 on its tint by our calculation; now 4.75).
- Not changed: `--color-tag-green` / `--color-tag-red` (card labels, not states), dark, midnight and high contrast (already above 4.5).

Effect is site-wide and only darker: every success/error text, badge, bar and button in light (and sepia error). White on these is 6.2–6.7:1.

Tested: axe colour-contrast on 10 pages (audit x2, My Audits, dashboard, progress, history; teacher queue and students; admin overview and users) in all five themes, 50 of 50 runs clean apart from the exempt wordmark; the audit page suite again with the badge exemption removed, 69 passed. `next build` passes.

Still open: the wordmark (logotype, exempt); the not-found page returns HTTP 200 (pre-existing).

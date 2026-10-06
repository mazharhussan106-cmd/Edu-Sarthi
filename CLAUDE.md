# Edusarthi — working rules

Read this before writing any code in this repo.

## What this is

An English spoken-communication training platform. Students submit audio, video
or photos of written work. Teachers return a rubric-scored audit with
timestamped notes. Two roles, one site, separate interfaces.

Modelled on TypeSarthi (typingsarthi.com) — same stack, same patterns, new
niche. When something is described as "same as TypeSarthi", port it verbatim.
Do not redesign it.

## Read first — this is how separate chats stay connected

Every chat (session) starts with an empty memory. Chats do not share what was said; they share only what is **in the repository**. So before building anything:

0. Read `docs/PROJECT-MEMORY.md` — what every chat has done, which branch holds what, decisions not to undo, and the open work in priority order.
1. Read `docs/flashcard-library-plan.md` — what the flashcard library is, what is built, what was decided, what is still open.
2. For anything about flashcards, look at the real card first: `components/flashcards/` (CardSurface, CardFront, CardUsage, CardPractice, CardControls, FlashcardDeck) and the mockups `docs/flashcard-v2-cards.png`, `docs/flashcard-built.png`. **Every kind of card (built-in words, student decks, Excel-imported Python/SQL cards) must use that same card — framed with the navy header band, three sides that turn, fit-to-screen text, and the Known / Unknown / Remark bar. Do not invent a new card look.**
3. Before finishing a chat, write what changed and what is undecided into the plan doc (or a new file in `docs/`) and push it. A decision that lives only in a chat is lost.
4. Chats work on their own branches (`claude/<name>`). Work reaches the other chats only after it is merged into the main branch.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript strict · Tailwind v4 ·
Prisma 6 · Auth.js v5 (JWT strategy) · PostgreSQL on Supabase · Supabase
Storage · Vercel via GitHub.

## Environment

- Windows, PowerShell. One command at a time — no `&&` chaining.
- `DATABASE_URL` must be in `.env`. Prisma does not read `.env.local`.
- Supabase: transaction pooler on 6543 for runtime, session pooler on 5432 for
  `directUrl`. The direct `db.xxx.supabase.co` host has no IPv4 and will not
  resolve.

## Code standards — these are not suggestions

1. **Server components by default.** `"use client"` only where interaction
   genuinely requires it. A component that just displays server data stays on
   the server.

2. **Never hardcode a colour.** Every colour goes through a token.
   `bg-white`, `border-ink/10`, `divide-ink/10`, `hover:bg-ink/5` are bugs —
   use `bg-surface`, `border-border`, `divide-border`, `hover:bg-hover`.
   Tailwind's own palette counts as hardcoding: `bg-pink-500` is a bug too.
   Alpha on a token (`bg-accent/12`) is fine.

3. **Comment the why, never the what.** `// increment counter` is noise.
   `// Counted even for non-existent accounts, or the throttle only protects
   real users` is why the next person does not simplify it away.

4. **Every file gets a header comment** saying what it owns and what it
   deliberately does not.

5. **Validate at the boundary with Zod.** Same schema client-side for feedback,
   server-side for enforcement. Client validation is assumed bypassed.

6. **Scope every query by the current user.** `where: { id, userId }`, not
   fetch-then-compare.

7. **`export const revalidate = 0`** on anything user-specific.

8. **Parse responses defensively.** `res.text()` then `JSON.parse` in a try,
   never a bare `res.json()`.

9. **Non-atomic work goes outside the transaction.** Transactions cover only
   what must genuinely commit or fail together.

10. **Fail safe on secrets.** Throw rather than log a live reset link in
    production.

11. **Keep files under ~250 lines.** Past that, say so and suggest a split.

12. **Every error message tells the user what to do next**, not just what went
    wrong.

13. **Accessibility is not optional.** Label every input, keyboard-navigable
    forms, check contrast on every theme.

14. **Assume slow phones on patchy mobile data.** Loading states everywhere, no
    blocking full-page spinners.

15. **Be honest in user-facing copy.** No overclaiming, no fake testimonials,
    no invented statistics.

## Folder structure

`lib/` for logic · `components/ui/` for primitives · `components/<domain>/` for
feature components · route groups `(auth)` `(student)` `(teacher)` `(shared)`
`(public)`.

Name things the way TypeSarthi names them. Do not invent a new convention
halfway through.

## Things that will bite

| Problem | Cause | Fix |
|---|---|---|
| `P2028 Transaction not found` | Prisma's 5s timeout vs pooler latency | `{ maxWait: 10_000, timeout: 20_000 }`, non-atomic work outside |
| `EMAXCONNSESSION` | Session pooler's 15-client cap | Transaction pooler + `connection_limit=1` |
| `P1012 env var not found` | Prisma reads `.env`, not `.env.local` | Move `DATABASE_URL` |
| `MissingSecret` | Variable is `AUTH_SECRET` in v5 | Not `NEXTAUTH_SECRET` |
| `UntrustedHost` | Localhost untrusted by default | `AUTH_TRUST_HOST=true` |
| Prisma error inside middleware | Something imported `lib/auth` | Middleware imports `lib/auth.config` only |
| Hydration mismatch on `<body>` | Grammarly injects attributes | `suppressHydrationWarning` |
| Random selection never varies | Route caching | `export const revalidate = 0` |

## Working style

- Complete files, never diffs. No "add this around line 40", no
  `// ... rest unchanged`.
- One step at a time. Numbered. One file or one command per step.
- Ask clarifying questions before building, not after.
- When a build fails, get the full error output before proposing a fix.
- Test locally before pushing. Never push untested.
- Before any schema change, say what data could be lost.
- Never two migrations in one step.
- Do not stack fixes. Two failed attempts means stop and ask.
- When something breaks after a change, revert first, confirm, then re-apply.
- Do not add features that were not asked for. Mention them in one line at the
  end instead.
- If a change touches more than 6 files, give the plan and get approval first.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

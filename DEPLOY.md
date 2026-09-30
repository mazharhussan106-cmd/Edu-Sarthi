# Deploying Edusarthi

Do not deploy until it runs locally. A first deploy of untested code turns two
problems into one problem you cannot reproduce.

## Before the first push

- `npm run build` passes locally. `npm run dev` is more forgiving than the
  production build — type errors and unused imports surface here.
- `.gitignore` contains `.env`. Confirm with `git status` that `.env` is not
  listed before the first commit.

## Vercel setup

1. Import the GitHub repo at vercel.com. Framework is detected as Next.js.
2. **Check which project you are in before adding environment variables.** If
   you also have TypeSarthi on this account, the two look identical in the
   dashboard and variables added to the wrong one fail silently.
3. Add every variable from `.env` **except** `AUTH_TRUST_HOST` — Vercel sets its
   own host and does not need it.
4. Set `NEXT_PUBLIC_APP_URL` to the live URL, not localhost. A stale value here
   emails password reset links pointing at localhost.

## Environment variables need a redeploy

Saving a variable does nothing on its own. Deployments → the latest one →
Redeploy. This catches people every time.

## Secrets

`SUPABASE_SERVICE_ROLE_KEY` bypasses row-level security entirely — treat it like
the database password. It belongs in `.env` and in Vercel, never in a
git-tracked file and never in a `NEXT_PUBLIC_` variable.

If a key or connection string is ever pasted into a chat, an issue, or a commit,
rotate it in the Supabase dashboard afterwards.

## Email

SendGrid needs domain authentication before it will send from
`noreply@edusarthi.com` — CNAME records plus DMARC, added at your DNS provider.
Until that is done, `lib/email.ts` throws in production rather than silently not
sending. That is deliberate: a user waiting for an email that was never
attempted is worse than a visible error.

## Storage

The `submissions` bucket must exist in the same Supabase project as the
database, must be **private**, and must have its own size and MIME limits set.
The signed upload URL carries no constraints, so the bucket is the enforcement.

## After deploying

Walk the whole loop on the live URL, on a phone:

1. Register, receive the code by email, verify.
2. Record something in the browser. iPhone Safari records `audio/mp4` — if the
   bucket's MIME list is missing that, iPhone uploads fail while Chrome works.
3. Change your role to `TEACHER` in Supabase, sign out, sign back in.
4. Review the submission, add a note, send the audit.
5. Change back to `STUDENT`, sign out and in, read the audit.

If something works locally but not in production, that narrows it to environment
variables, the database, or a serverless limit — not to the code.

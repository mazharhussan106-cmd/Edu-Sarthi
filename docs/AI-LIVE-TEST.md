# Testing the AI features with real keys (written 26 Oct 2026)

The AI draft audit and the AI card maker were built and tested against a
**fake** OpenAI and Anthropic. This file is how to check them against the real
ones, in the order that finds problems cheapest. Each run costs a few cents.

## 0. Once

1. Create the keys: `OPENAI_API_KEY` (platform.openai.com, for audio) and
   `ANTHROPIC_API_KEY` (console.anthropic.com). Set a **monthly spend limit** on
   both dashboards first.
2. Put both in `.env` in the project folder (never in `.env.local`, never in
   chat or in git; `.env` is already ignored).
3. `npm install` if you have not, then one command at a time in PowerShell.

## 1. Card maker, text only

```
npx tsx --env-file=.env scripts/ai-smoke.ts cards "Class 9 Physics chapter 3, Newton's laws of motion"
```

Look at:
- **Questions:** are they about this topic, short, and few? Is the language
  question asked only when it should be? Is "how many cards" always there?
- **Cards:** are they true? One idea each? Is the notes text readable (bold
  labels, bullets)? Are chapters sensible?
- **Time** for the 5-card step. The app asks for up to 10 cards and allows
  300 s on the route; if 5 cards take over ~60 s, ten may not fit on a plan
  with a short Vercel limit.
- **Tokens** printed per step.

Try three more requests that are different in kind: a single word
(`cards "ephemeral"`), ten English words for a topic, and a book
(`cards "Atomic Habits by James Clear"`). For the book, check the cards do not
copy long passages and say so in the note when they only know it by title.

## 2. Card maker, PDF and photo

```
npx tsx --env-file=.env scripts/ai-smoke.ts pdf path\to\chapter.pdf "Make cards for this chapter"
npx tsx --env-file=.env scripts/ai-smoke.ts image path\to\notes.jpg
```

Use a real chapter (about 10-20 pages) and a photo of handwritten or printed
notes. Look at:
- **Tokens for the PDF.** The app refuses a request over 60,000 input tokens
  (`MAX_SOURCE_TOKENS` in `lib/aiCards.ts`). If a normal chapter is over that,
  raise it, and raise `FREE_TOKENS_TOTAL` in `lib/aiCardLimits.ts` too.
- Are the cards built from the file (not from general knowledge)?

## 3. Audio draft

Record about 40 seconds of English speech **with a few deliberate mistakes**
("yesterday I goes to market", "I buyed vegetables") and a couple of "um"s.

```
npx tsx --env-file=.env scripts/ai-smoke.ts audio path\to\recording.webm
```

Look at:
- **Does the transcript keep the mistakes and the "um"s?** This is the biggest
  open question: Whisper tends to tidy speech. If it fixes them, the grammar
  and fluency drafts will be too generous and the plan needs another approach
  (do not ship it as is).
- Are the scores and reasons believable? Compare with how you would audit it.
- Do the "low confidence" stretches match words you actually mumbled?

Do this with 10-20 real student recordings and compare each draft with the
teacher's own audit before teachers rely on it.

## 4. In the deployed app (after merge, keys in Vercel, Database setup run)

- Make cards with a **PDF** from the deck page. Supabase may refuse the upload
  if the bucket has a file-type or size rule; if so, allow `application/pdf`
  up to 10 MB in the bucket settings.
- Make ten cards and note how long it takes against the time limit.
- Add a file, leave without making cards, and check the file is gone after the
  daily retention run (up to two days; needs `CRON_SECRET` set).
- Sign in as a teacher: "Make an AI draft" on a real submission.

## What to send back

The time and tokens printed, what the audio transcript looked like next to what
was said, and any card that was wrong. The prompts to tune first are in
`lib/aiCardPrompts.ts` (cards) and `lib/aiDraft.ts` (audit, `SYSTEM`).

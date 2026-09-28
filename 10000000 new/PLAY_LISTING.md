# Play Store listing

Draft copy and the Data Safety answers. Written 2026-09-17 against what the app
actually does, not what would be easiest to claim.

---

## The basics

| Field | Value |
|---|---|
| App name | **Speak Sarthi** |
| Package | `com.speaksarthi.app` — permanent after first upload |
| Category | Education |
| Content rating | Everyone (complete the questionnaire; there is no user-generated content shared between users, which keeps this simple) |
| Contains ads | **No** |
| In-app purchases | **Yes** — ₹99 to ₹499 per item |

---

## Short description

80 characters is the hard limit. This one is 74:

```
Learn spoken English with AI pronunciation feedback. 1,000 words, offline.
```

Two alternatives if that one tests badly — the second is exactly 80, so any edit
to it will overflow:

```
Practise English out loud. AI tells you which sounds to work on. Works offline.
```
```
1,000 English words, spoken practice, and honest feedback on your pronunciation.
```

---

## Full description

Written for someone scrolling a store listing on a cheap phone, deciding in four
seconds. No feature list until the second half, because a feature list does not
answer "will this help me".

```
Most English apps teach you to read English. Speak Sarthi teaches you to say it.

You learn the 1,000 words that carry most everyday English — not a random
dictionary, but the words people actually use at work, in interviews, and in
conversation. For each one you see how it is said, hear it, and then say it
yourself.

WHAT MAKES IT DIFFERENT

You speak, and you find out how you sounded. Record a sentence and the app tells
you which sounds came out clearly and which ones to work on — not a vague score,
but the specific sounds, so you know what to practise tomorrow.

It is built for Indian English speakers. It does not mark you wrong for having
an Indian accent. It measures whether you would be understood, which is the
thing that actually matters.

WORKS WITHOUT INTERNET

All 1,000 words, the flashcards, the practice sentences, the quizzes and your
progress are on your phone. No signal needed. Only the AI pronunciation score
needs a connection.

WHAT YOU GET, FREE, FOREVER

• All 1,000 words with meanings, examples and phrases
• Flashcards with spaced repetition, so you revise at the right moment
• Listening practice
• Record yourself and play it back
• Mistake review — the words you keep getting wrong
• Streaks, badges and statistics
• Full backup and restore

ABOUT CREDITS

The AI pronunciation scoring costs us money each time it runs, so it uses
credits. You get 50 free to start, and you earn more by finishing lessons and
keeping a weekly streak. If you want more, packs start at ₹99.

Run out of credits and everything else keeps working — including recording and
playing yourself back. You lose the AI score, never the app.

NO ADS. NO SUBSCRIPTION. NOTHING SOLD ON.

We do not show ads. We do not take a monthly payment. Your recordings are not
used to train anything and are not kept on our servers.

Start speaking. That is the only part that actually works.
```

---

## Graphics you still need

| | |
|---|---|
| App icon | 512 × 512 PNG — built, see `res/mipmap` |
| Feature graphic | 1024 × 500 — **not made** |
| Phone screenshots | 2–8, at least 1080px on the short side — **not made**, needs a running build |

Screenshots have to come from the real app, so they are blocked on Phase 0.
Worth shooting: the study card, the speaking screen mid-score, the sounds-to-work-on
list, and the statistics screen.

---

## Data Safety form

Google believes this form over the privacy policy when they disagree, so fill it
in from here and make sure the policy matches.

### Does your app collect or share any of the required user data types?

**Yes.**

### Data types to declare

| Type | Collected | Shared | Required? | Purpose | Notes |
|---|---|---|---|---|---|
| **Audio → Voice or sound recordings** | Yes | Yes | Optional | App functionality | Only when the learner taps "Score it". Sent to Microsoft Azure AI Speech for scoring. Not stored on our server. |
| **Personal info → Email address** | Yes | No | Optional | Account management | Only if the learner chooses Google sign-in, which is offered when credits run low and can be declined. |
| **Financial info → Purchase history** | Yes | No | Optional | App functionality | Purchase tokens from Google Play, kept so one purchase cannot be redeemed twice. No card or UPI details ever reach us. |
| **App info and performance → Crash logs** | No | No | — | — | No analytics or crash SDK is connected. **If you add one later, change this.** |

### The judgement call on "Shared"

Audio is marked **shared** because it is transferred to Microsoft. Google does
allow data sent to a "service provider" processing on your behalf to be excluded
from sharing — but that exclusion depends on the contractual relationship, and
declaring it as shared is the conservative answer that cannot be wrong in the
direction that gets an app removed.

**Worth confirming with your reviewer.** Under-declaring here is one of the more
common reasons apps get pulled.

### Other answers

| Question | Answer |
|---|---|
| Is all data encrypted in transit? | **Yes** — HTTPS throughout |
| Do you provide a way to request data deletion? | **Yes** — by email, stated in the privacy policy |
| Is data collection optional for users? | **Yes** — the app works fully without ever scoring anything |
| Committed to Play Families Policy? | No — not aimed at children |

### The random installation identifier

The app generates a random id on first launch and the server uses it to hold your
credit balance. It is **not** a device identifier, is not derived from the device
or the user, and is not shared with anyone.

Google's "Device or other IDs" category is aimed at identifiers used to track
across apps or services, which this is not. **Ask your reviewer whether to
declare it anyway.** The honest description is in the privacy policy either way.

---

## Before you upload

- [ ] Privacy policy published at a public URL — Play requires this, and a
      Google Doc link is acceptable
- [ ] The URL entered in the Play Console listing
- [ ] Data Safety form matches the policy, field by field
- [ ] Content rating questionnaire completed
- [ ] Screenshots from a real device

# What is not built yet

Written 2026-09-17, after the server and the credit model were finished.

The code is in better shape than this list suggests. What follows is almost
entirely **things that need an account, a real device, or a measurement** —
not code left unwritten.

---

## Read this first: the real deadline is not what it looks like

The goal was "in front of learners within a month." One external rule decides
whether that is possible, and it has nothing to do with the code.

**A Play Console personal account created after 13 November 2023 cannot publish
to production until it has run a closed test with at least 12 testers, opted in
continuously for at least 14 days.** After that you apply for production access
and Google reviews it, usually within seven days.

So the floor is roughly **three weeks of waiting** that cannot be compressed, and
the clock cannot start until there is an installable build and a Play Console
account that exists.

This reorders everything below. The Play Console account and a compiling app are
not week-four tasks — they are day-one tasks, and everything else fits around
them.

---

## Phase 0 — The two long poles. Start both this week, in parallel.

These do not depend on each other. Whichever you delay is the one that sets your
launch date.

### 0A · Compile the app

**Not built:** 120 Kotlin files have never been through a compiler. Maven is
unreachable from the environment they were written in, so every one of them is
statically checked and unproven.

There will be errors. That is expected, not a failure — static checks catch
missing imports and unresolved references, never type inference, generics or
Compose's compiler plugin.

- [ ] Open in Android Studio, `./gradlew assembleDebug`
- [ ] Work through the errors — see [FIRST_BUILD.md](FIRST_BUILD.md)
- [ ] `./gradlew test` green
- [ ] **Commit `app/schemas/`** after the first successful build. Room generates
      it, and it is the only thing that makes future database migrations
      possible. Losing it means every schema change becomes a wipe.
- [ ] Runs on a real phone, not an emulator

**Done looks like:** the app opens on a phone and you can study a word.

### 0B · Open the Play Console account

**Not built:** no account exists.

- [ ] Register (one-time fee, and identity verification which takes days in India)
- [ ] Create the app entry — this is what starts the clock being *able* to start
- [ ] Line up 12 real people willing to install and stay opted in for 14 days.
      **Start asking now.** This is the step people underestimate; they are real
      humans who have to accept an invite and not uninstall.

**Done looks like:** an app entry exists and you have 12 names.

---

## Phase 1 — Measure what a scored attempt costs

**Not built:** no Azure account. Every price in this project rests on a working
figure of ₹1.50/minute — about ₹0.40 per attempt — that has never been checked
against a real bill. Azure's pricing page renders its numbers in JavaScript and
could not be read, and pronunciation assessment appears to be billed on top of
speech-to-text rather than at a flat rate.

- [ ] Azure account, Speech resource, free **F0** tier — 5 audio hours a month
- [ ] Send 20–30 real clips through it
- [ ] Read the actual bill and work out the real cost per attempt
- [ ] Set the credit counts in `worker/src/catalog.ts`

**Why this blocks things:** pack prices are settled (₹99 / ₹249 / ₹499) but the
credit *counts* are deliberately not. Guessing them is how you either lose money
on every sale or price yourself out.

**One tension to resolve here:** 50 free credits next to a ₹99 entry pack of 60
is a weak ladder — nobody who just got 50 free buys 60 more. The entry pack has
to land well above the grant.

**Done looks like:** a number you measured, and `PACKS` set from it.

---

## Phase 2 — Deploy the server

**Not built:** the Worker is written and tested but has never run anywhere.
`wrangler.toml` still has `REPLACE_WITH_YOUR_D1_DATABASE_ID` in it.

- [ ] Cloudflare account
- [ ] `wrangler d1 create speak-sarthi` → put the id in `wrangler.toml`
- [ ] `wrangler kv namespace create CACHE` → same
- [ ] `npm run db:remote` to apply `schema.sql`
- [ ] Four secrets: `AZURE_SPEECH_KEY`, `SESSION_SIGNING_KEY`,
      `GOOGLE_OAUTH_CLIENT_ID`, `PLAY_SERVICE_ACCOUNT`
- [ ] `npm run deploy`
- [ ] Put the URL in `local.properties` as `SPEECH_PROXY_URL`, rebuild
- [ ] **Confirm `DEV_TRUST_CLIENT_PURCHASES` is `"0"`** — at `"1"` it is a free
      credit machine

**Done looks like:** you record a sentence on a real phone and get a real score
back, and the credit count goes down by one.

That moment is the first time the whole system has ever worked end to end.

---

## Phase 3 — Money

**Not built:** no products exist, and `verifyPurchase` / `acknowledgePurchase`
have never executed against anything.

- [ ] Three **consumable** in-app products, ids exactly:
      `credits_entry` · `credits_standard` · `credits_large`
- [ ] Service account with Play Developer API access → JSON into the Worker's
      `PLAY_SERVICE_ACCOUNT` secret
- [ ] Test purchase with a licence-test account on a real device
- [ ] **Buy the same pack twice.** This is the test that matters: if consumption
      is not working, the second purchase fails and you will not find out until
      a real customer does.
- [ ] Check a `pending` purchase if you can produce one — UPI mandates sit
      unconfirmed for hours and the path is written but unproven

**Done looks like:** money moves, credits arrive, and the pack can be bought again.

---

## Phase 4 — Sign-in

**Not built:** `verifyGoogleIdToken` has never seen a real Google token. The
signature check against Google's published keys is the riskiest single function
in the server — a token's payload is plain base64, and code that reads it without
verifying will believe anything it is handed.

- [ ] OAuth client ID (Android type, needs your signing certificate's SHA-1)
- [ ] `GOOGLE_OAUTH_CLIENT_ID` in `local.properties` and as a Worker secret
- [ ] Sign in on a real device and confirm credits survive
- [ ] **Sign in on a second device with the same account** — confirm the balances
      merge and no second welcome grant appears

**Done looks like:** two phones, one account, one balance.

---

## Phase 5 — The artwork

**Not built:** 10 of 1,000 exist, as a trial nobody has judged yet. No host.

- [ ] Look at the ten and decide whether the style holds
- [ ] Rewrite the **21 scenes flagged in `tools/prompts_1000.csv`** — they ask
      for text inside the picture, which the brief rules out
- [ ] Generate the rest — `tools/HIGGSFIELD_GUIDE.md` is the whole recipe
- [ ] Convert with `tools/to_webp.py`
- [ ] Host them — Cloudflare R2 is the obvious choice now the Worker is there
- [ ] `AppPreferences.setIllustrationBaseUrl(...)`

**Cost:** 2.5 credits each for flat vector = 2,500 for the full set. The balance
was 1,639 before the trial, so the full set needs topping up. Realistic is half
the price but does not work for the ~250 abstract words.

**This phase does not block launch.** A word with no artwork renders its text
fallback in the same frame, so the layout never shifts. Ship without it if the
clock is tight.

---

## Phase 6 — Check the scoring is kind

**Not built:** the band thresholds in `ScoreInterpreter` (`CLEAR_FROM = 78`,
`UNDERSTANDABLE_FROM = 62`, `NEEDS_WORK_FROM = 45`) are reasoned from the
service's scale. They have never been checked against a real human voice.

- [ ] Record 20 real sentences — ideally from people like your actual learners,
      not from you
- [ ] Put them through the live service
- [ ] Check the bands land where a fair listener would put them

**Why this matters more than it looks:** these numbers decide whether a learner
is told their English is clear. Set too high, a perfectly intelligible Indian
English speaker is told they are not good enough on every sentence — which is
the exact opposite of what this app is for.

**Done looks like:** you have listened to 20 clips and agreed with the app.

---

## Phase 7 — The listing

**Not built:** the privacy policy has 8 unfilled blanks; the launcher icon is
still the placeholder speech bubble; the feedback address is a personal Gmail.

- [ ] Privacy policy: `[COMPANY NAME]`, `[ADDRESS]`, `[CONTACT EMAIL]`,
      `[APP NAME]`, `[DATE]`, and the speech processor named (Microsoft Azure,
      and where it processes). You are an individual publisher, so the name and
      address are **yours** — worth knowing before you publish them
- [ ] Get it read by someone qualified
- [ ] A real feedback inbox, not a personal Gmail
- [ ] A launcher icon
- [ ] Store listing, screenshots, description
- [ ] Data Safety form — answer it from what the app actually does: audio goes
      to a processor for scoring, nothing else leaves the device

---

## Phase 8 — The 14-day clock

- [ ] Signed release build with R8 on, then **test recording and scoring again**
      — R8 strips things, and a serialisation class that works in debug and
      fails in release is a classic
- [ ] Keep the keystore somewhere you will still have in five years. Lose it and
      you cannot update this app, ever
- [ ] Upload to closed testing
- [ ] 12 testers opted in, 14 continuous days
- [ ] Apply for production access; Google reviews in about a week

**This is the phase you cannot speed up.** Everything above should be finished
before it starts, because a bug found on day 10 restarts nothing — but a bug
found by 12 people who then uninstall does.

---

## Phase 9 — Production

- [ ] Publish
- [ ] Watch the Azure bill daily for the first week. The credit system is tested,
      but it has never met real users
- [ ] Watch for `pending` purchases that never clear

---

## Not in this launch

**The live test with a real person** — a human listens to a learner's practice
and scores it, and the learner earns credits. Recorded in
[DECISIONS.md](DECISIONS.md) and worth building. It is a tutoring marketplace
attached to a vocabulary app: a person on the other end, scheduling, and a way
to pay them. It cannot ship in a month and it changes the privacy policy.

**Rewarded ads** — available, never debated. An ad SDK collects data from every
install and changes both the privacy policy and the Data Safety form.

---

## The honest summary

| | |
|---|---|
| Written and tested | The Worker — 16 tests, run and passing |
| Written, never compiled | The app — 120 Kotlin files |
| Never executed | Google sign-in, Play verification, the live Azure call |
| Never measured | The cost of a scored attempt; the band thresholds |
| Never created | Azure account, Cloudflare account, Play Console account |
| 1% done | The artwork — 10 of 1,000 |

Nothing on this list is hard. Most of it is accounts, waiting, and one afternoon
with a compiler. The long pole is 12 people and 14 days, and that is the only
part that does not care how fast you work.

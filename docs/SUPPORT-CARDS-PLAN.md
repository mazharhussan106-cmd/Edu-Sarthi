# Customer-support English cards — plan and 10 samples (13 Oct 2026)

Status (15 Oct 2026): **180-card workbook built and audited** — `content/support-cards/Support_Cards_EduSarthi.xlsx` (+ `support.json` for a future app import). App integration (Support chip) is NOT built yet. Mockup of one card: `docs/support-card.png` (source `docs/support-card-mockup.html`). Written after the owner's answers below. Update this file when anything is decided.

## Owner's answers (13 Oct 2026)

| Question | Answer |
|---|---|
| Channel | Voice, Chat and Email — **a separate section for each** |
| Domain | General (works in any industry) |
| Level | **Separate for each level**: Basic, Intermediate, Advanced |
| Card content | Listening (understanding the customer), grammar + tone note, audio + "record yourself", and **how to ask the customer and how to answer** |

## Where it lives

A new chip next to Words / Chunk / Grammar: **Support**. Same EduSarthi card as chunks (navy header, three sides, fit-to-screen text, Known / Unknown / Remark, Day 1·3·7·15·30·60 review). No new card look.

Inside Support: three tabs — **Voice · Chat · Email** — and in each, a level filter **Basic · Intermediate · Advanced**. Each card is one of two kinds, shown as a badge:

- **Say it** — the agent learns to *speak or write* a sentence.
- **Understand it** — the agent reads/hears what the *customer* says, works out what it means and learns what to ask next.

## The card (three sides)

| Side 1 · Recognition | Side 2 · Understanding | Side 3 · Practice |
|---|---|---|
| Badge (Say / Understand), channel, level, situation ("customer is waiting on hold"), the sentence (large), 🔊 listen at normal and slow speed | Hindi meaning (Devanagari + Roman), when to use, **tone note** (polite / neutral / too blunt), **Watch out ✗ / ✓** (a real wrong version and the fix), **Ask next** (what to ask the customer), **Reply you may hear**, grammar point in one line | Fill the blank, pick the polite one, "what do you say next?", write/say your own sentence, **Record yourself for audit** (goes to a teacher), review plan |

Voice cards add: stress/pace tip and a "sound polite on the phone" note. Chat cards add: short-form version (under 15 words). Email cards add: subject line and where the sentence sits (opening / body / closing).

## Build order (after the owner agrees)

1. **Data** — a workbook in `content/support-cards/` (one sheet per channel), exported to `support.json` (see Plan check 1).
2. **Content scale** — suggested first release: 3 channels × 3 levels × 20 cards = **180 cards** (≈ 120 Say, 60 Understand), grouped by situation: greeting, verify, hold, apologise, clarify, refuse politely, escalate, next steps, close.
3. **App** — Support chip + channel tabs + level filter + badge (only if the admin importer is not enough). More than 6 files → plan and approval first.
4. **Teacher check** — every card is a draft until a verified teacher marks it checked (same rule as the Hindi drafts on chunk cards).

## Plan check (13 Oct 2026) — corrections

1. **The Excel importer is the wrong road for this section.** It makes a *Library deck*, not a Support chip with Voice/Chat/Email tabs, and it only knows the 56-point fields — "Ask next", "Replies you may hear", "Situation", "Call stage" would be dropped. Decision: build Support **the way Chunk and Grammar were built** — rows in the `Word` table with a new kind `SUPPORT` (additive enum value, no data loss), a JSON file in `content/support-cards/`, an import script added to the Database setup button, and the chunk card components reused. The workbook stays the editing source.
2. **"Record yourself for audit" does not appear on admin-imported library decks** (only on verified-teacher decks). The chunk route above gets it for free, as chunk cards already have it.
3. **Listening ("Understand it") cards** use the browser's built-in voice, which the cards already use for 🔊; "Slow" = the same voice at a lower rate. It cannot imitate a real angry or accented customer — say so in the app, and add recorded audio later if needed.
4. **Email cards** cannot be "said". Side 3 for email: write your reply in a box (not saved) and *Send a photo/text for audit* instead of a voice recording. Needs the owner's yes.
5. Sample 4 wording changed: "May I know…" is common in Indian English but sounds odd to many international customers → "Could you tell me what the issue is…".
6. More than 6 files will change in the app → plan and approval before the code step (CLAUDE.md rule).

Decided: `[Company]` stays as the placeholder everywhere.

## Open questions for the owner

- Accent / pronunciation guidance for Indian speakers (like chunk cards) — include on Voice cards? (Recommended: yes.)
- Is a separate audio recording per card wanted (needs a voice artist or text-to-speech), or is the browser's built-in voice enough?

## 10 sample cards

| # | Channel · Level · Kind | Sentence | Hindi meaning | Situation | Tone / Watch out |
|---|---|---|---|---|---|
| 1 | Voice · Basic · Say | "Thank you for calling [Company]. How can I help you today?" | कॉल करने के लिए धन्यवाद। मैं आज आपकी कैसे मदद कर सकता/सकती हूँ? | First line of every call | ✗ "What do you want?" → ✓ "How can I help you today?" |
| 2 | Voice · Basic · Say | "Could you hold for a moment, please? I'll check that for you." | क्या आप एक पल होल्ड कर सकते हैं? मैं यह देखता/देखती हूँ। | Need time to look something up | ✗ "Wait." → ✓ "Could you hold…, please?" (ask, don't order) |
| 3 | Voice · Basic · Say | "May I have your name and registered mobile number, please?" | क्या मैं आपका नाम और रजिस्टर्ड मोबाइल नंबर ले सकता/सकती हूँ? | Verifying the caller | ✗ "Tell me your number." → ✓ "May I have…, please?" |
| 4 | Voice · Basic · Understand | Customer: "I want to speak to your manager." | ग्राहक आपके मैनेजर से बात करना चाहता है। | Customer is upset or wants a higher authority | Ask next: "Could you tell me what the issue is, so I can help you or pass it on to the right person?" |
| 5 | Voice · Intermediate · Say | "I'm sorry for the inconvenience this has caused you." | इससे आपको जो परेशानी हुई उसके लिए मुझे खेद है। | After a mistake or delay | ✗ "Sorry for your problem." → ✓ "…the inconvenience this has caused you." |
| 6 | Voice · Intermediate · Understand | Customer: "I've been charged twice for the same thing." | मुझसे एक ही चीज़ के दो बार पैसे काटे गए हैं। | Billing complaint | Ask next: "Could you tell me the date and the amount of both charges?" |
| 7 | Voice · Advanced · Say | "I understand how frustrating this must be, and I want to get it resolved for you today." | मैं समझता/समझती हूँ कि यह कितना निराशाजनक होगा, और मैं इसे आज ही हल करना चाहता/चाहती हूँ। | Angry customer | Don't promise what you can't do: say "I want to", not "I will definitely" unless sure |
| 8 | Chat · Basic · Say | "Hi, thanks for contacting us. I'm happy to help." | नमस्ते, संपर्क करने के लिए धन्यवाद। मुझे मदद करके खुशी होगी। | First chat message | Keep it short; one greeting, one offer |
| 9 | Chat · Intermediate · Say | "I've raised a refund request. You'll get an update within 3 working days." | मैंने रिफंड रिक्वेस्ट डाल दी है। आपको 3 कार्य-दिवसों में अपडेट मिलेगा। | Telling the customer what happens next | ✗ "You will get it soon." → ✓ give a clear time ("within 3 working days") |
| 10 | Email · Advanced · Say | "I have escalated your case to our billing team, who will contact you by Friday. Please let me know if there is anything else I can help with." | मैंने आपका मामला हमारी बिलिंग टीम को भेज दिया है, जो शुक्रवार तक आपसे संपर्क करेगी। यदि मैं और कुछ मदद कर सकूँ तो बताइए। | Closing an email after escalating | Name a day, not "soon". Use "who" for people/teams |

### Sample 2 expanded as a full card

**Side 1** — Voice · Basic · Say it. Situation: *you need 30 seconds to check the customer's order.* Sentence: **"Could you hold for a moment, please? I'll check that for you."** 🔊 normal / slow.

**Side 2** — Hindi: क्या आप एक पल होल्ड कर सकते हैं? मैं यह देखता/देखती हूँ। · *Kya aap ek pal hold kar sakte hain? Main yeh dekhta/dekhti hoon.*
Tone: polite and soft — "Could you…" is a request; "Hold on" is an order.
Watch out: ✗ "Hold the line, I check." → ✓ "I'll check that for you." (after *I'll* use the base verb)
Ask next (when you return): "Thank you for holding. Is the order number ending in 4821?"
Reply you may hear: "Sure, no problem." / "How long will it take?"
Grammar in one line: *Could you + base verb* = polite request; *I'll* = decision made now.

**Side 3** — Fill the blank: "____ you hold for a moment, please?" → *Could*. Pick the polite one: (a) "Wait here." (b) "Could you hold, please?" (c) "You must hold." Say it: *What will you say if the check takes longer than a minute?* Then **Record yourself for audit.**

## Honesty notes

- All wording is drafted by Claude and must be checked by a verified teacher before students see it.
- Sample 10 says "by Friday" only because the example gives a day; real cards must not teach agents to promise times the company cannot keep.

## Build and audit record (15 Oct 2026)

- 56 fields per card (6 card · 13 side 1 · 22 side 2 · 15 side 3), defined in `content/support-cards/source/schema.py`.
- 180 cards = Voice/Chat/Email × Basic/Intermediate/Advanced × 20 (14 "Say it" + 6 "Understand it" each).
- Research: `source/research.md` (111 sourced links, 31 writer rules in `source/rules.md`).
- Audit round 1: 9 independent reviewers, ~1,500 logged fixes (`audit/audit1_*.md`). MCQ answer letters rebalanced to 5/5/5/5 per group; correct option no longer the giveaway longest.
- Audit round 2 (regression): one reviewer per channel re-checked every round-1 fix and did a fresh pass; chat and email also had an adversarial pass (`audit/audit2_*.md`).
- Final checks: `audit.py` 0 errors, `rules_check.py` 0 issues, workbook recalculated with 0 formula errors.
- Still a DRAFT until a verified teacher checks it. Next step (needs approval, >6 files): app Support chip using the chunk-card route.

# Audit round 2 — Chat channel (CSC-B, CSC-I, CSC-A) — regression and cross-level review

Second, independent reviewer. Step 1: every round-1 row in audit1_CB.md, audit1_CI.md and audit1_CA.md was checked against the card as it now stands. Step 2: a fresh pass over all 60 cards with checklist A–I plus the round-2 points (natural wording, level progression, no duplicates across the channel, promises, two-answer blanks, Indian-English switches, placeholders, MCQ balance). Rows marked "R1-regression" are problems that a round-1 fix introduced or left half done.

| ID | field | problem | fix |
|---|---|---|---|
| CSC-B-001 | mcq_options | R1-regression: round-1's new distractor D wrote the placeholder as "[COMPANY]", which the audit rejects (only "[Company]" may stay) | "WELCOME TO [Company]!!" (still shouting; answer letter unchanged) |
| CSC-B-002 | ask_next / replies_you_may_hear / mini_conversation | order ORD-48213 is the same number as CSC-I-001 and three other chat cards | ORD-36571 |
| CSC-B-002 | fill_blank | "confirmation ____" also fits "message" | added (Hint: starts with "e") |
| CSC-B-003 | alt_2 / mini_conversation / whats_next_reply | the same customer name "Sarah" ran through nine Basic cards; same order number as CSC-B-002 | customer is now Tom; order ORD-50927 |
| CSC-B-004 | ask_next | gave the same "should reach you by Thursday" line as whats_next_reply and if_customer_pushes | now offers the tracking link only |
| CSC-B-005 | situation | promise "I'll send you a replacement today" with nothing showing the agent had checked (open point from round 1) | situation now says the system shows a free replacement can go out today with no need to return the broken lamp, so the sentence, ask_next and whats_next_reply are checked facts |
| CSC-B-005 | alt_2 / mini_conversation | name "Sarah" again; "Friday" used on five chat cards | Grace; Saturday |
| CSC-B-005 | hindi_to_english | "Mujhe maaf kijiye ki…" is a calque; round 1 replaced it with "Mujhe afsos hai ki…" on the CI cards | "Mujhe afsos hai ki…" |
| CSC-B-007 | sentence / hindi_meaning / hindi_roman / key_chunk / watch_out / positive_swap / alt_1 / alt_2 / more_formal / mini_conversation / fill_blank | placeholder "[link]" (only [Company] may stay) | concrete made-up address "[Company].com/reset"; key_chunk slot is now "___" |
| CSC-B-008 | if_customer_pushes | R1-regression: round-1 line "I'm sorry to ask twice" — the agent had asked only once; name "Sarah" again | "Sorry to double-check, Imran." |
| CSC-B-009 | hindi_to_english | "Kya aap abhi bhi hain?" is incomplete Hindi (round 1 fixed the same phrase on CSC-I-011) | "Kya aap abhi bhi chat par hain?" |
| CSC-B-010 | hindi_to_english / answer | the same practice line ("Aapka swagat hai. Aapka din accha ho" → "You're welcome. Have a great day") as CSC-B-019 | now translates the card's second half: "Thanks for chatting with us. Have a great evening!" |
| CSC-B-011 | ask_next | R1-regression: round-1 ask_next began "You're welcome" before the customer had thanked anyone, and repeated the mini-conversation close; name "Sarah" again | open-door line without "You're welcome"; customer is now Kiran |
| CSC-B-012 | mini_conversation | "will join you shortly" is a vague time (rule 9) | "in about a minute" |
| CSC-B-014 | situation | firm date "will arrive by Friday" with nothing showing it was checked (open point from round 1) | situation now says the agent can see the card was posted with delivery booked for Friday |
| CSC-B-014 | sentence and 9 other fields | name "Sarah" again | Fatima (stress FA-ti-ma, Hindi फ़ातिमा); more_formal "Ms Khan" |
| CSC-B-014 | whats_next_reply | told the customer to chat "if it doesn't come" with no day to wait for | "If it hasn't arrived by Friday, start a chat…" |
| CSC-B-015 | 12 fields (watch_out, positive_swap, ask_next, mini_conversation, mcq A, reorder…) | the model reply used the same agent (Ananya) and almost the same line as CSC-B-001 | agent is now Kabir, and the reply returns the customer's "Good morning" |
| CSC-B-015 | hindi_to_english / answer | R1-regression: round-1's new prompt was almost word for word CSC-B-001's practice line | "Suprabhaat! Main [Company] se Kabir hoon…" → "Good morning! I'm Kabir from [Company]. How can I help you today?" |
| CSC-B-015 | fill_blank / fill_answer | third "help" blank in the file (also CSC-B-018, CSC-B-019) | blank is now "Good ____!" → morning (hint: return the customer's greeting) |
| CSC-B-015 | hindi_meaning / hindi_roman | added "namaste", which "hi good morning" does not say | "हाय, आपको सुप्रभात।" / "Hi, aapko suprabhaat." |
| CSC-B-016 | mcq_options | R1-regression: round-1's new distractor B used the placeholder "[link]" | "Here is the tracking link for your latest order…" (answer A unchanged) |
| CSC-B-016 | mini_conversation / channel_note | order 48213 shared with other cards | 61834 |
| CSC-B-017 | positive_swap / mini_conversation / whats_next_reply | free return and same-day dispatch promised before the order was checked (open point from round 1) | positive_swap: "Let me check your order and get the right one to you"; mini: "I can see the mix-up on your order, so I'll send…"; whats_next_reply: "Let me check your order first. If we sent the wrong item, the return is free…" |
| CSC-B-017 | if_customer_pushes | R1-regression: round-1 line promised "send the right item today" before any check | "What I can do is check your order now and get the right item to you as quickly as possible." |
| CSC-B-017 | role_play / replies / mini_conversation | role-play skipped the check; order number shared | "checks the order, and then arranges…"; ORD-72405 |
| CSC-B-018 | whats_next_customer / whats_next_reply | R1-regression: round 1 removed the vague "that's worrying" from the mini conversation but left it in whats_next_reply, and whats_next repeated the mini conversation's "money taken but order failed" | new exchange: "can't log in, need my ticket now" → "I'm sorry you're locked out. What's the email address on your account? I'll check it straight away." |
| CSC-B-018 | fill_blank / fill_answer | second of three "help" blanks in the file | "I'll help you right ____ (Hint: the opposite of "later")" → now |
| CSC-B-018 | hindi_to_english_answer | "What has happened?" is stiff | "What's happened?" |
| CSC-B-019 | 8 fields | name "Sarah" again; "Friday" again | Aisha; Wednesday |
PROGRESS: done cards_CB.txt
| CSC-I-001 | watch_out | ✗ part showed "Ma'am" (an Indian-English switch) plus a service slip, not a learner language error | genuine errors: "I can see you asking… look in it" → "you're asking… look into it" |
| CSC-I-001 | fill_blank | "I can ____ you're asking" also fits "tell" | clue "(starts with s)" after the blank |
| CSC-I-001 | mcq_options | R1-regression: round-1's new distractor C opened with "Ma'am", which the deck treats as a switch, not an error | "Hello there, thanks for contacting us…"; still wrong because it asks for a number she already gave |
| CSC-I-002 | whats_next_reply | R1-regression: round-1's new reply opened with "No problem" to a locked-out, frustrated customer (rules_check flag, rule 14) | "Don't worry, it's easy to miss." |
| CSC-I-002 | if_customer_pushes | bare "I understand" before the action (rule 7) | "I know you're in a hurry." |
| CSC-I-002 | linking | "let_me → lem-mee" contradicts CSC-B-003, where round 1 marked it as a casual contraction | "let-mee" (very light "t"); same fix on CSC-I-009 |
| CSC-I-003 | watch_out | ✗ part used "refund is raised", which cultural_note correctly calls an Indian-English switch | genuine error: "reach to your original payment method" → "reach your…" |
| CSC-I-003 | mcq_options | distractors A and D used "reflect" and "under process" (Indian-English forms) as the wrong parts | "wait for it to appear"; "is being handled and will show in your account soon"; still wrong because they give no time |
| CSC-I-003 | whats_next_reply | "reply to this chat" may not work after the chat closes (round 1 fixed the same point on CSC-I-005/011/020) | "message us with your order number, and we'll check it…" |
| CSC-I-005 | situation | the sentence promises the billing team's deadline, but nothing showed the agent had checked it (the card's own when_not_to_use forbids this) | situation now says the agent checked that billing replies to such cases by 6 pm the next day |
| CSC-I-005 | watch_out | ✗ part was "revert back", an Indian-English switch (it belongs in cultural_note/dont_say) | genuine errors: "by tomorrow 6 pm… you need not to stay" → "by 6 pm tomorrow… you don't need to stay" (ties to the "to" blank) |
| CSC-I-005 | mcq_options | R1-regression: round-1's new distractor A used "revert" as the wrong part | "will get back to you soon"; still wrong because "soon" is no time |
| CSC-I-006 | whole card (42 fields) | taught the same line, scenario and follow-up as CSC-B-005 ("I'm sorry your order arrived damaged… replacement", "Do I need to send it back? No, keep it"); not harder than the Basic card | rewritten on the same teaching point (empathy in writing, B2): a birthday gift that arrived a day late after express delivery — "I'm really sorry the gift didn't arrive in time for your daughter's birthday, Vikram. I can see why that's upsetting, and I've refunded the express delivery charge." All quoting fields, Hindi, MCQ (answer B kept, options 78–86 characters), reorder and practice rebuilt; the fix is one the agent has already done |
| CSC-I-007 | watch_out | ✗ part used "the same" (switch) and "be on hold" | genuine error: "it is taking more longer than I expected" → "a bit longer" (ties to the blank) |
| CSC-I-008 | situation | offered a pickup point and a free return although its own when_not_to_use says to check first; whats_next_reply promised "nothing to pay" | situation now says the system shows both options are available |
| CSC-I-008 | watch_out / tone_note | "as per policy" quoted as the error; round 1 treated this phrase as a switch on CSC-A-002 | genuine errors in ✗ ("once an order ship", "to nearby pickup point"); tone_note quotes "Not possible, it's our policy" |
| CSC-I-008 | mcq_options / mcq_why | R1-regression: round-1's new distractor A used "as per our policy" as the wrong part | "our rules do not allow an address change after dispatch"; mcq_why "hides behind a rule" |
| CSC-I-009 | watch_out | ✗ part was a service slip, not a language error | genuine errors: "try to login… tell me it is working or not" → "try logging in… let me know if it works" |
| CSC-I-009 | whats_next_reply | almost word for word the sentence of CSC-B-006 ("send me a screenshot… see exactly what's happening") | asks what the error says, word for word, to tell a new problem from the old one |
| CSC-I-010 | watch_out | ✗ part was "one query at a time" (formal wording, not a learner error) | genuine error: "one after one" → "one at a time" (ties to the blank) |
| CSC-I-012 | watch_out | ✗ part used "Kindly" (switch) | genuine error: "If you will have a moment" → "If you have a moment" |
| CSC-I-012 | mcq_options | R1-regression: round-1's new distractor B used "Kindly" as the wrong part | "Please complete the feedback form before you leave"; still wrong because it pressures |
| CSC-I-012 | fill_blank | "if you ____ a moment" also fits "get" | clue "(starts with h)" after the blank |
| CSC-I-013 | watch_out | ✗ part used "the same" (switch) | genuine error: "pick up from where we left" → "pick up where we left off" (ties to the blank) |
| CSC-I-013 | mcq_options | R1-regression: round-1's new distractor B used "the same" as the wrong part | "Please note down your ticket number for future reference…"; still a form letter with no number |
| CSC-I-018 | fill_blank | "you were ____ yesterday" also fits "expecting" (flagged by round 1, left open) | clue "(starts with p)" after the blank |
| CSC-I-019 | watch_out | ✗ part used "sir, as per the process" (switches) and was a service slip | genuine errors: "Yes, I can do. I'll set the exchange now." → "Yes, I can. I'll set up the exchange now." |
| CSC-I-020 | alt_2 | "No problem" to a customer who is giving up (rules_check flag, rule 14) | "Sorry for the extra step." |
PROGRESS: done cards_CI.txt
| CSC-A-002 | situation | the free one-month pause was offered with nothing showing the agent may offer it | situation now says the system allows one trial per account but lets the agent offer a free one-month pause |
| CSC-A-003 | hindi_meaning / hindi_roman / hindi_to_english | "माफ़ कीजिए कि…" / "Maaf kijiye…" calque; the channel now uses "मुझे अफ़सोस है कि…" for a specific apology | "मुझे अफ़सोस है कि…" / "Mujhe afsos hai ki…" |
| CSC-A-004 | linking | want_to → "wonna" is not a real respelling | "won-tuh" |
| CSC-A-005 | whats_next_reply | R1-regression: round-1's new reply stated a cause ("the update changed how sign-in works") the agent had not checked | "I'm sorry it gave you such a fright. I don't know the exact cause yet, so I'll report it to our technical team today." |
| CSC-A-006 | hindi_to_english / answer | practice line reused CSC-B-012's scenario (billing team changes a plan) | "Dev in our technical team… can fix your router. I've sent him a summary." |
| CSC-A-006 | mini_conversation | name "Sarah" again | Nikhil |
| CSC-A-008 | hindi_to_english | "Maaf kijiye…" calque; speaker gender fixed to male | "Mujhe afsos hai ki…", "bataunga/bataungi… karta/karti" |
| CSC-A-008 | cultural_note | claimed Indian agents defend colleagues "out of loyalty" (the kind of unsupported claim round 1 removed from CSC-A-016/018/019) | "Defending a colleague (\"He is new, sir\") can feel loyal, but international customers may hear it as an excuse…" |
| CSC-A-009 | situation | the sentence promises the Basic plan "keeps all your saved files" with nothing showing it was checked | situation now says the agent can see the Basic plan has room for all the files |
| CSC-A-009 | if_customer_pushes | the pushback and reply were the same exchange as the mini conversation, and used "No problem at all" on a cancellation | new pushback ("Why are you trying to sell me something?") answered with an apology, the reason and the offer to cancel |
| CSC-A-010 | if_customer_pushes | "We'll ask the courier" had no time (rule 9) | "I'll ask the courier today to collect it, at no cost to you." |
| CSC-A-010 | hindi_to_english | prompt lacked "already", which the answer has | "pehle hi" added |
| CSC-A-010 | whats_next_customer / whats_next_reply | repeated the mini conversation's last turn (arrives Thursday, tracking link) and used the vague "in a moment" | new exchange: "can you make sure this doesn't happen again?" → the agent has checked that only the new address is saved |
| CSC-A-011 | hindi_to_english / answer | "Shukravaar ko aa jayega" / "will arrive on Friday" is firmer than the card's "confirmed for Friday" (round 1 softened alt_1 for the same reason) | "Shukravaar ke liye pakka ho gaya hai" / "is confirmed for Friday" |
| CSC-A-012 | mini_conversation | order numbers "4471 and 4472" clash with the card digits "4471" in CSC-A-007 | 30512 and 30518 |
| CSC-A-012 | linking | let_me_know → "le-mee-noh" dropped the t | "let-mee-noh" (very light "t") |
| CSC-A-014 | sentence / hindi_meaning / hindi_roman / alt_1 / alt_2 / more_formal / mini_conversation / mcq_options | placeholder "[number]" (left open by round 1; only [Company] may stay) | concrete made-up number "+91 832 555 0147" |
| CSC-A-014 | whats_next_customer / whats_next_reply | same customer line and near-same reply as the mini conversation's turns 3–4 | new exchange: "what if the hotel says no?" → booking and price stay as they are, plus an offer to check other hotels |
| CSC-A-015 | hindi_to_english | prompt was an instruction about the task, not a line to translate (round 1 fixed this on CSC-B-015…020 only) | real line: "Main samajh sakti hoon ki aap yeh abhi suljhana chahte hain…" |
| CSC-A-016 | situation | "send you a loan device tomorrow" offered with nothing showing it was available | situation now says the system shows a loan device can be sent |
| CSC-A-016 | fill_blank / fill_answer | R1-regression: round 1 moved the blank to "What I can ____ is" → do, the same practice task as CSC-A-002 | "two more weeks is a long ____ (starts with w)" → wait |
| CSC-A-016 | hindi_to_english | prompt was an instruction | real line: "Aap sahi hain, do hafte bahut lamba intezaar hai…" |
| CSC-A-016 | whats_next_customer / whats_next_reply | same customer line and near-same reply as if_customer_pushes (round 1 fixed this pattern on 015, 017, 019) | new exchange: "I don't want a loan, I want mine back" |
| CSC-A-017 | hindi_to_english | "Maaf kijiye…" calque | "Mujhe afsos hai ki bot se madad nahin mili." |
| CSC-A-018 | hindi_to_english / answer | prompt was an instruction | real line: "Aapko iski shikaayat karne ka poora haq hai…" |
| CSC-A-018 | whats_next_customer / whats_next_reply | "it won't help anyway" repeated if_customer_pushes ("It won't help") with almost the same reply | new exchange: "I've already filed it" → "That's completely your right. I'll still escalate your deposit case today…" |
| CSC-A-019 | hindi_to_english / answer | prompt was an instruction | real line: "Mujhe pata hai ki yeh aapki ummeed ke mutaabik nahin hai. £20 ka credit…" |
| CSC-A-020 | situation / ask_next / mini_conversation / fill_blank / mcq_options / channel_note / role_play | same scenario (missed callbacks) as CSC-I-018; "and if nobody comes again?" fitted a visit better than a call | the broken promises are now two missed engineer visits |
| CSC-A-020 | fill_blank | "doubt ____" also fits "me" | clue "(the company, not just you)" after the blank |
| CSC-A-020 | hindi_to_english | prompt was an instruction | real line: "Aapke paas hum par shak karne ki poori wajah hai…" |
| CSC-A-020 | watch_out | ✗ part included "sir" (a switch) beside the real error | "✗ Trust me, this time it will be done 100%." |
PROGRESS: done cards_CA.txt

## Summary

All 60 chat cards (CSC-B/I/A-001…020) were checked. Step 1 re-opened every round-1 row; Step 2 was a fresh pass with checklist A–I and the round-2 points. All replacements were scripted, and each one asserted that the old text occurred exactly once in the target card and field. id, channel, level, kind, call_stage and speaker were not touched. No MCQ option was reordered and no mcq_answer was changed. Final checks: `python3 audit.py cards_CB.txt cards_CI.txt cards_CA.txt` gives 0 errors and 0 warnings for chat IDs (the 120 remaining lines are "card missing" for the other channels). The correct option is clearly the longest in 0 cards per file. `python3 rules_check.py` lists nothing for CSC IDs.

**Round-1 regressions found: 15** (rows marked R1-regression). 2 were placeholders in new distractors (CSC-B-001 "[COMPANY]", CSC-B-016 "[link]"). 5 were Indian-English switches used as the wrong part of a new MCQ distractor (CSC-I-001 Ma'am, I-005 revert, I-008 as per policy, I-012 Kindly, I-013 the same). 2 were unchecked claims in new lines: CSC-B-017 "send the right item today" and CSC-A-005, which gave an invented cause. 3 were duplicates that the fixes created or left: CSC-B-015's new translation repeated CSC-B-001, CSC-A-016's new blank repeated CSC-A-002, and CSC-B-018's whats_next kept the vague apology and repeated the mini conversation. 3 were wording or logic slips: CSC-B-008 "sorry to ask twice", CSC-B-011 "You're welcome" before any thanks, and CSC-I-002 "No problem" to a locked-out customer. Every other round-1 fix was confirmed correct and complete: changed sentences are carried into watch_out, fill_blank, the MCQ, reorder, the mini conversation and the Hindi fields, and mcq_why matches the options.

**New fixes: 74 rows**, by type:
- 13 Indian-English switch fixes. watch_out ✗ now shows only real learner errors (CSC-I-001, 003, 005, 007, 008, 009, 010, 012, 013, 019; CSC-A-020). Distractors no longer use "reflect" or "under process" (CSC-I-003). One unsupported claim about Indian agents was removed (CSC-A-008).
- 13 Hindi and translation fixes. 6 "Say it in English" prompts in CSC-A-015…020 were instructions, not lines to translate. The "Maaf kijiye ki…" calque was replaced. Missing "already" and "chat par" were added, and an extra "namaste" was removed.
- 12 duplicate fixes. CSC-I-006 was rewritten as a birthday gift that arrived late, because it taught the same line and follow-up as CSC-B-005. CSC-B-015's model reply was too close to CSC-B-001's. CSC-A-020's missed-callback scenario repeated CSC-I-018's. Practice lines repeated other cards (B-010/B-019, A-006/B-012, I-009/B-006). Within cards, whats_next repeated if_customer_pushes or the mini conversation (B-004, A-009, A-010, A-014, A-016, A-018).
- 9 promise fixes. The situation now shows that the agent has checked the replacement, date or option (CSC-B-005, B-014, I-005, I-008, A-002, A-009, A-016), or the line is softened to a check the agent can make (CSC-B-017). This closes round 1's open points on B-005, B-014 and B-017.
- 8 variety fixes. "Sarah" appeared on 10 chat cards and is now on 2. ORD-48213 / 48213 appeared on 5 cards. "Friday" was overused. Order numbers in CSC-A-012 clashed with the card digits in CSC-A-007.
- 7 two-answer blanks were given a bracketed clue or a different blank: CSC-B-002, B-015, B-018, I-001, I-012, I-018 (left open by round 1), A-020.
- 7 service-rule and wording fixes: vague "shortly" / "in a moment", a bare "I understand", "No problem" on a frustrated chat, "reply to this chat" after it closes, and a stiff "What has happened?".
- 3 pronunciation fixes: "let me" linking made consistent across the channel, and "wonna" removed.
- 2 placeholder fixes: CSC-B-007 [link] became [Company].com/reset, and CSC-A-014 [number] became +91 832 555 0147.

**Left as they are, deliberately:**
- CSC-I-011 opens "Are you still there, Sana?" like CSC-B-009. It is the standard check-in, and the card teaches the warning that follows it (check in → warn → close).
- CSC-B-020, CSC-I-007 and CSC-I-016 share the pattern "sorry for the wait + update you within N minutes". It is the standard chat reply. Each card's key line differs: "Yes, I'm here!", a proactive update, and reading a complaint phrased as a question.
- CSC-A-006 (B2 handover) is only moderately harder than CSC-B-012 (B1 transfer). It adds a named colleague, a summary already sent and a charge reversal, so it was kept rather than lengthened past the 30-word chat limit.
- CSC-B-003 keeps "One moment, please" because plan.txt fixes that wording. The card still teaches a real time for longer checks (MCQ, when_not_to_use).
- In the Understand-it cards, alt_1 and alt_2 are customer variants in CB and CA but agent replies in CI. Both fit the schema hint ("different wording, same job"), and rewriting 6 cards was outside this regression pass.
- cultural_note lines that describe Indian-English phrasing habits ("Myself Ananya", "Welcome", "Ma'am", "Sorry for the inconvenience caused") were kept as switches. Only claims about agents' attitudes were removed.
- CB fill-blank clues keep round 1's "(Hint: …)" placed after the blank at the end of the sentence. New clues in CI and CA sit right after the blank. Both are bracketed clues after the blank, and each card still has exactly one "____".

## Adversarial round 1

| ID | Field | Result | Note |
|---|---|---|---|
| CSC-B-010 | hindi_meaning / hindi_roman | applied | "आपका स्वागत है" is a greeting-type welcome and the calque the cultural_note warns against; now "धन्यवाद की कोई बात नहीं" / "Dhanyavaad ki koi baat nahin". |
| CSC-B-019 | hindi_to_english | applied | Prompt now "Dhanyavaad ki koi baat nahin! Aapka din accha ho."; hindi_to_english_answer "You're welcome! Have a great day." unchanged and still matches. |
| CSC-A-005 | hindi_meaning / hindi_roman | applied | Agreement fixed: "का सिंक होना … बंद हो गया" / "ka sync hona … band ho gaya". |
| CSC-A-012 | hindi_meaning / hindi_roman | applied | Conditional restored: "कहीं कुछ अब भी गलत तो नहीं दिख रहा?" / "kahin kuchh ab bhi galat to nahin dikh raha?". |
| CSC-I-020 | whats_next_customer (+ whats_next_reply) | applied | Customer line now "its fine now, i sorted it out myself", so closing is correct. whats_next_reply changed "glad you found it" → "glad it's sorted" to match the new line. |
| CSC-A-020 | watch_out | applied | ✓ part now matches the missed-visit scenario (engineer booked Tuesday 10 am, EN-2287), consistent with ask_next and MCQ option A. |
| CSC-A-010 | situation | applied | Situation now shows the order history was checked and the replacement dispatched, so the admission and "already sent" are supported and when_not_to_use holds. |
| CSC-A-016 | if_customer_pushes | applied | Invented "arrives next Tuesday" replaced by a checkable promise (check date today, message by 5 pm, and again when fixed). |
| CSC-I-011 | mcq_question (+ situation, mini_conversation) | applied | MCQ now asks what to send after an unanswered check-in, so it no longer contradicts CSC-B-009 (check in → warn → close). situation and the mini_conversation stage note were updated to show the earlier check-in, so the card stays consistent. Options and mcq_answer unchanged. |
| CSC-B-017 | if_customer_pushes | applied | Removed "at our warehouse" (an unchecked cause); added "I'm sorry this happened." |
| CSC-B-006 | whats_next_reply | applied | Android/iPhone removed (no real brands); now generic buttons + offer to walk the customer through it. |

Checks after the fixes: `audit.py` gives 0 errors and 0 warnings for chat IDs (the 120 errors are only "card missing" for the other channels); `rules_check.py` gives 0 rule issues.

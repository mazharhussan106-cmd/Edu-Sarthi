# Audit round 2 - voice channel (cards_VB.txt, cards_VI.txt, cards_VA.txt)

Second, independent review. Step 1: every row of audit1_VB.md, audit1_VI.md and audit1_VA.md was re-checked against the card as it stands; a broken or incomplete round-1 fix is marked "R1-regression". Step 2: a fresh pass over all 60 cards with checklist A-I plus the round-2 points (native-trainer wording, level progression, no repeated lines/minis/tasks across the channel, accurate channel notes, rules.md, checkable promises, unambiguous blanks, Indian-English forms as switches only, concrete placeholders, MCQ giveaways).

## cards_VB.txt (Voice - Basic)

| ID | field | problem | fix |
|---|---|---|---|
| CSV-B-001 | whats_next_reply | Vague "I'm sorry about that" after a specific complaint (rule 8), and "I can look into it" is weaker than "I will" | "I'm sorry you've been charged twice. I'll look into it for you." |
| CSV-B-002 | linking | R1-regression: the round-1 respelling "fool-name" gives "full" the long vowel of "fool" (full/fool is a minimal pair), so it trains the wrong sound | "ful-naym" with a note: short "u" as in "put", not "fool" |
| CSV-B-003 | cultural_note | "Indian scripts often say" is an unsupported claim about scripts (round 1 removed the same claim from B-020), and the switch was not framed as "may not expect" | "is common on Indian calls … international callers may not expect it" |
| CSV-B-003 | mini_conversation | Anna Brooks is also the caller in B-002's mini and record task; names should vary | email changed to lucy.grant@example.com |
| CSV-B-004 | fill_blank | R1-regression: the round-1 blank "I'm ____, I didn't catch that" also accepts "afraid" | clue added: "(starts with s)" |
| CSV-B-005 | mcq_options | B and C were spoken lines while A and D were actions, so the question ("best next step") mixed two kinds of answer | B and C now read Ask, "…" / Say, "…"; mcq_why still matches |
| CSV-B-006 | mini_conversation | Opened with "Where is my order?", the same first line as B-010's mini | "My order still hasn't arrived. Can you check it?" |
| CSV-B-006 | whats_next_reply | "I'll come back to you before then if it takes longer" is confusing (before what?) | "If it's going to take longer, I'll come back and tell you before then." |
| CSV-B-008 | more_formal | "my apologies that your parcel was delivered late" is not idiomatic | "my apologies for the late delivery of your parcel" |
| CSV-B-008 | if_customer_pushes | "see what I can do" is a hedge (rule 9) after the caller rejected the apology | names the action now: checking the delivery record to say what went wrong and how to put it right |
| CSV-B-008 | mini_conversation | Bare "I understand." in reply to "It was a gift" sounds flat | "That makes it even more disappointing." |
| CSV-B-009 | if_customer_pushes | Semicolon inside a spoken line | comma + "so" |
| CSV-B-009 | alt_1 | Used CSV-I-001's teaching line "So, if I've understood correctly…", so two cards taught the same frame | "So, just to check: you paid twice for a single order. Is that right?" |
| CSV-B-009 | source_rule | Quoted CSV-I-001's line as this card's rule | rule stated without quoting the other card's sentence |
| CSV-B-011 | alt_1 | "sort that out with you" is not idiomatic | "sort that out for you" |
| CSV-B-011 | alt_2 | "No worries" is casual for a voice line (deck rule on casual "No problem"-type phrases) | "Don't worry, let's get you back into your account." |
| CSV-B-012 | tone_note | Quoted the Indian-English switch "You are not audible" as a bad line outside cultural_note/dont_say/positive_swap | replaced with "I can't hear you properly"; the switch stays in cultural_note |
| CSV-B-013 | situation | Password-reset scenario repeated in CSV-I-013 (same fix, same close) and close to B-011's login case | new scenario: a re-sent missing e-ticket |
| CSV-B-013 | alt_1 | Must follow the new scenario | "Can you see the ticket in your inbox now?" |
| CSV-B-013 | ask_next | Must follow the new scenario; also near-copy of I-011's ask_next | ticket in inbox + download from account page |
| CSV-B-013 | if_customer_pushes | Must follow the new scenario | "Actually, I still can't see it." → specific apology + check the booking email together |
| CSV-B-013 | mini_conversation | Customer said "I'm in now" then the agent asked if it was fixed, and the customer skipped the first question; scenario changed | new email arrives → check → "Yes, the ticket's there. And no, that's everything" → close |
| CSV-B-013 | fill_blank | R1-regression: the round-1 blank "anything ____" also accepts "more" | clue added: "(starts with e)" |
| CSV-B-013 | mcq_question | Must follow the new scenario | "You have just re-sent a missing e-ticket." |
| CSV-B-013 | mcq_options | A, B and D referred to the password scenario | A asks if they can see the ticket, B "I've sent it again", D blames them for not checking spam; letter and mcq_why unchanged |
| CSV-B-013 | hindi_to_english | Must follow the new scenario | "Kya ab aapko ticket dikh raha hai?" |
| CSV-B-013 | hindi_to_english_answer | Must match the new prompt | "Can you see the ticket now?" |
| CSV-B-013 | whats_next_customer | Delivery-address follow-up does not fit a ticket booking | "Can I add my wife's name to the booking?" |
| CSV-B-013 | whats_next_reply | Must answer the new follow-up | "Could you give me her full name, please?" |
| CSV-B-013 | role_play | Must follow the new scenario | re-sent e-ticket |
| CSV-B-014 | if_customer_pushes | "You'll get a confirmation email today" promises a system action the card never shows the agent checking | "I've just sent a confirmation to the email address on your account" (the agent's own action) |
| CSV-B-015 | mcq_why | Framed "I am hearing you" as something callers "may not expect", but watch_out and self_check treat it as a genuine stative-verb error (rule 26) | explains the error: with "hear", English says "can hear" |
| CSV-B-016 | mini_conversation | Order number SO48210 is also used in B-019 | SO37542 |
| CSV-B-016 | channel_note | "Order 55021" repeats B-009's number | "Order SO37542" |
| CSV-B-016 | reorder_task + reorder_answer | "Sure I can help with that" repeats B-011's teaching line, and the card's real point is the open question | reorder now drills "Could you tell me what's happening with your order" (9 words) |
| CSV-B-018 | mini_conversation | Vague "I'm sorry about that" (rule 8) | "I'm sorry it didn't go through." |
| CSV-B-018 | whats_next_reply | Ignored what the customer said ("my card works everywhere else") | explains a bank safety check in plain words, then offers retry or another card |
| CSV-B-019 | if_customer_pushes | Near-copy of B-010's pushback answer ("That's fine. I can find your order with your email address instead") | "That's okay, I can find it another way. Could you give me the email address you ordered with?" |

PROGRESS: done cards_VB.txt

## cards_VI.txt (Voice - Intermediate)

Round-1 rows re-checked: all 144 rows hold (blanks with cues, rebuilt MCQs and their mcq_why, the rewritten CSV-I-014 sentence and every field quoting it, Hindi fixes). No R1-regression found in this file; the problems below are new.

| ID | field | problem | fix |
|---|---|---|---|
| CSV-I-001 | alt_1 | "Let me make sure I've got this right" is CSV-B-009's teaching line | "So the internet dropped after last night's update, and it hasn't come back since. Have I got that right?" |
| CSV-I-001 | if_customer_pushes | Near-copy of CSV-B-009's pushback answer ("I'm checking so I fix the right thing first time") | gives this card's own reason: the fix depends on when it stopped |
| CSV-I-001 | when_not_to_use | Word-for-word copy of CSV-B-009's when_not_to_use | new point for a longer call: sum up once, after the caller has finished |
| CSV-I-002 | alt_1 | "I'll fix this now" promises a result the agent cannot see yet | "I'll book you a new visit now." |
| CSV-I-002 | dont_say | Word-for-word copy of CSV-B-008's dont_say | "These things happen." (brushes off a week of waiting) |
| CSV-I-002 | whats_next_reply | Offered Thursday although ask_next had just offered tomorrow, and nothing showed the slot was checked | "I can see a slot tomorrow morning, between eight and twelve. Shall I book it for you?" |
| CSV-I-003 | ask_next | "call you by five … with the outcome" promises a result by a set time | "with an update" |
| CSV-I-003 | mini_conversation | Same promise of an outcome | "with an update" |
| CSV-I-003 | watch_out | ✓ part did not match the card's sentence ("explain it again" vs "to anyone else") | ✓ now quotes the sentence |
| CSV-I-003 | positive_swap | Quoted a different version of the sentence | quotes the sentence |
| CSV-I-003 | fill_blank | The practice sentence differed from the card's sentence | now the card's sentence with one blank |
| CSV-I-004 | if_customer_pushes | "stops the lock coming back" is a guarantee | "helps make sure the lock doesn't come straight back" |
| CSV-I-005 | alt_2 | Rule 1: thank the caller first on return; the line apologised first | thanks first, then the apology and the choice |
| CSV-I-005 | if_customer_pushes | No empathy before the reason (rule 7), and "I'd rather check than give you a wrong answer" is CSV-A-007's teaching line | specific apology for the longer wait, then the reason |
| CSV-I-005 | whats_next_reply | "before 3:30" contradicted ask_next and the mini ("by 3:20") | "by 3:20" |
| CSV-I-005 | cultural_note | Third card with the same "one minute, sir" note (B-006, A-011) | new switch note: "call you back" / "ring you back", always with a real time |
| CSV-I-006 | sentence + 14 other fields | The colleague was "Priya", the name the Basic cards use for the learner-agent herself; names should vary | renamed Anita in every English field (block rename, 15 occurrences) |
| CSV-I-006 | stress | Must follow the new name | "to-a-NEE-ta" |
| CSV-I-006 | hindi_meaning | Must follow the new name | "अनीता" |
| CSV-I-006 | hindi_roman | Devanagari says "वे", Roman said "woh" | "ve" |
| CSV-I-007 | situation | The card promises a last date; the situation must show the agent can see the timeline (brief: firm dates only when checked) | situation now says the system shows five to seven working days |
| CSV-I-007 | if_customer_pushes | No empathy before the reason (rule 7) | "I know a week feels long." first |
| CSV-I-008 | situation | The sentence offers a free return, but the situation never showed the agent checked that it is available | system shows it qualifies for a free return |
| CSV-I-008 | if_customer_pushes | Bare "I understand. It was already packed by then." sounds defensive | specific acknowledgement, then the reason, then the free return |
| CSV-I-008 | cultural_note | Same "As per policy" note as CSV-A-003 and CSV-A-012 | new, accurate switch: "dispatched" (India/UK) vs "shipped" (US) |
| CSV-I-009 | situation | The agent states the charge as fact; when_not_to_use says explain only after checking | the itemised bill is open on the agent's screen |
| CSV-I-010 | if_customer_pushes | Same opening ("Thanks, that helps") as the mini's last turn, and did not use the caller's information | "so we can skip that step", then the lights question |
| CSV-I-011 | if_customer_pushes | No acknowledgement of the caller's irritation | "Sorry, I know it's an extra step." first |
| CSV-I-011 | when_not_to_use | Implied the agent might hold a password or full card number to read back | says such details should never be taken on a call |
| CSV-I-012 | if_customer_pushes | No empathy line (rule 7); "I'd rather … than a guess" repeats CSV-A-007's teaching line | "I know you hoped it would be sorted today." + what tomorrow's call will bring |
| CSV-I-012 | ask_next | Near-copy of CSV-I-005 and CSV-A-007 ask_next ("Is this the best number…") | "Shall I call you on this number, or is there a better one for tomorrow afternoon?" |
| CSV-I-012 | role_play | Broken washing machine is also CSV-I-016's situation | broken oven |
| CSV-I-013 | customer_emotion | Near-copy of CSV-B-013 | "Pleased the account works again, and keen to get on with their day." |
| CSV-I-014 | source_rule | Near-copy of CSV-I-007's source_rule | rule specific to reference numbers |
| CSV-I-014 | cultural_note | "Double seven" is standard British English too, so presenting it as an Indian habit was inaccurate | common in India and the UK; some (US) callers may not expect it; read codes digit by digit |
| CSV-I-015 | ask_next | Near-copy of CSV-B-009's ask_next (date of the payments) | asks whether both payments are "completed" or one is "pending", which also covers when_not_to_use (temporary holds) |
| CSV-I-015 | mini_conversation | Same question as above; the refund followed without the agent saying it had checked | new question, and "I can see both on my side too" before the refund |
| CSV-I-015 | if_customer_pushes | Bare "I understand" | names the feeling first |
| CSV-I-016 | if_customer_pushes | Same opening as CSV-I-003's pushback ("I understand why you doubt it") | "After two calls, I don't blame you for doubting it." |
| CSV-I-017 | if_customer_pushes | "No problem" on a voice line (deck rule) | "That's fine, you don't need to." |
| CSV-I-018 | situation | The answer gives a firm day and window; the situation did not show the agent could see it | the date is on the tracking screen |
| CSV-I-020 | cultural_note | Same "I will revert … dictionaries" note as CSV-I-012 | new switch note on "I will let you know" / "discuss with family and revert" vs "I'll get back to you", all meaning "not yet" |
| CSV-I-020 | reorder_task + reorder_answer | Identical reorder task to CSV-B-019 ("Of course take your time") | now drills "Shall I email you the details so you can compare" (10 words) |
| CSV-I-020 | source_rule | Began with the same "Over-scripting backfires" rule as CSV-A-018 | "Respect the customer's decision: avoid pressure, and leave one clear, easy next step." |

PROGRESS: done cards_VI.txt

## cards_VA.txt (Voice - Advanced)

Round-1 rows re-checked: the two rewritten sentences (003, 012) and every field quoting them, the new blanks, the rebuilt MCQs and their mcq_why, the Hindi fixes and the stress/linking fixes all hold. No round-1 fix was found broken; one older mismatch round 1 missed is logged below (CSV-A-007 stress).

| ID | field | problem | fix |
|---|---|---|---|
| CSV-A-001 | situation | "This is their third call" duplicates CSV-I-016's teaching situation | the third-call detail removed; three days without internet is the trigger |
| CSV-A-001 | mini_conversation | The customer's line was CSV-I-016's sentence ("This is the third time I'm calling") | "Three days! Three days without internet, and nobody does anything!" |
| CSV-A-001 | cultural_note | Third card with the same "Sorry for the inconvenience" note (B-008, A-005) | new switch note: "Sir, please listen to me first" / "Sir, sir, sir" heard as talking over the caller |
| CSV-A-001 | whats_next_reply | Same opening as CSV-A-016's model line ("I understand why you feel that way") | "I can see why it feels that way after three days." |
| CSV-A-001 | hindi_to_english | Near-copy of CSV-I-002's prompt, and easier than an Advanced card should be | new prompt: three days without internet, anger is fair, checking the line |
| CSV-A-001 | hindi_to_english_answer | Must match the new prompt | "You've had no internet for three days, so you have every right to be upset. I'll check your line right now." |
| CSV-A-002 | ask_next | Used CSV-I-001's teaching line, and the "charged twice" story repeats B-009, I-015 and A-005 | new billing mix-up (bills to the old address + late fee) with "Have I got that right?" |
| CSV-A-002 | mini_conversation | Same story and the same I-001 paraphrase line | new story; the agent's summary is in its own words |
| CSV-A-002 | role_play | Must follow the new story | bills to an old address and a late fee |
| CSV-A-003 | situation | The sentence offers full store credit, but the situation never showed the agent checked it is available | system shows full store credit is still available |
| CSV-A-003 | grammar_note | Word-for-word copy of CSV-I-008's grammar note | explains "I'm not able to" (softer than "can't") and "as" (= because) |
| CSV-A-003 | watch_out | ✗ used the Indian-English switch "As per policy" as the error (deck rule: switches are not errors) | ✗ now has genuine errors (missing "the", "is finished last week") |
| CSV-A-003 | mcq_options | Distractor A used the switch "as per our policy" without the "fine in India" framing | "our policy does not allow refunds after thirty days"; the flaw (hides behind policy, offers nothing) is unchanged, letter unchanged |
| CSV-A-004 | sentence | Round-1 open question: "I'll sort out your booking" promises a fix before the agent has looked at anything | "If we can keep it respectful, I'll look into your booking straight away." (a commitment the agent controls) |
| CSV-A-004 | stress | Must follow the new sentence | "i'll LOOK in-to your BOOK-ing straight a-WAY" |
| CSV-A-004 | linking | Must follow the new sentence | look_into → "loo-kin-too" |
| CSV-A-004 | intonation | Must follow the new sentence | warmer fall on "straight away" |
| CSV-A-004 | hindi_meaning | Must follow the new sentence | "तो मैं अभी आपकी बुकिंग देखता/देखती हूँ।" |
| CSV-A-004 | hindi_roman | Must match the Devanagari | "to main abhi aapki booking dekhta/dekhti hoon." |
| CSV-A-004 | simple_meaning | Must follow the new sentence | "I will check your booking right away." |
| CSV-A-004 | positive_swap | Quoted the old sentence | quotes the new sentence |
| CSV-A-004 | mini_conversation | Quoted the old sentence | quotes the new sentence |
| CSV-A-005 | source_rule | Near-copy of CSV-B-008's source rule | rule specific to owning a company mistake (same Lewicki source) |
| CSV-A-005 | cultural_note | Same "Sorry for the inconvenience caused" note as B-008 and A-001 | new switch note: "from our end" / "from the system side" vs a plain "That was our mistake" |
| CSV-A-006 | alt_2 | Near-copy of CSV-I-006's alt_2 ("I'll give her all the details first, so…") | "She'll hear the whole story from me before she says a word to you." |
| CSV-A-006 | memory_hook | Same relay-race hook as CSV-I-006 | junior doctor calling in a senior one, notes read at the bedside |
| CSV-A-006 | source_rule | Near-copy of CSV-I-006's warm-transfer rule | supervisor-on-request rule (Zendesk chat-etiquette guidance) plus the warm handover |
| CSV-A-006 | whats_next_reply | Near-copy of CSV-B-006's reply | "I'll be back with you in two minutes or less, with Meera on the line." |
| CSV-A-007 | stress | Stress line said "i'll come BACK to you" but the sentence says "I'll get back to you" (missed by round 1, not caused by it) | "i'll GET BACK to you" |
| CSV-A-008 | mini_conversation | Vague "I'm sorry about that" for a company-caused delay (rule 8) | "I'm sorry it's late, especially when you need it for work." |
| CSV-A-009 | source_rule | Quoted "What I can do is…", which is not in this card's sentence | agree first, offer one relevant option with permission, leave the customer in control |
| CSV-A-011 | watch_out | ✗ mixed an Indian-English switch ("there only") with the real errors | ✗ now shows genuine errors only (missing article, no time, an order) |
| CSV-A-011 | cultural_note | Third card with the same "one minute, sir" note (B-006, I-005) | new switch note: Indian-English "I am there" vs "I'm still here / still with you" |
| CSV-A-012 | sentence | Third card teaching "What I can do is" (I-008, A-003); this card's point is the reason behind the rule | "Instead, I can ask them to hold it at your local depot." |
| CSV-A-012 | stress | Must follow the new sentence | "in-STEAD · i can ASK them…" |
| CSV-A-012 | intonation | Must follow the new sentence | brighter start on "Instead" |
| CSV-A-012 | hindi_meaning | Must follow the new sentence | "इसके बजाय," added |
| CSV-A-012 | hindi_roman | Must match the Devanagari | "Iske bajaay," added |
| CSV-A-012 | key_chunk | Must follow the new sentence | "Instead, I can ___." |
| CSV-A-012 | grammar_pattern | Must follow the new sentence | "Instead, + I can + base verb" |
| CSV-A-012 | tone_note | Quoted the switch "As per policy" outside cultural_note/dont_say/positive_swap | "It's company policy, so the address cannot be changed" |
| CSV-A-012 | watch_out | ✗ used the switch "As per company policy" as the error | ✗ now genuine errors (missing articles, "parcel leave") |
| CSV-A-012 | positive_swap | Quoted the old sentence | quotes the new sentence |
| CSV-A-012 | cultural_note | Third "As per policy" note (I-008, A-003) | new switch note: "courier boy / delivery boy" vs "the driver" |
| CSV-A-012 | channel_note | Near-copy of CSV-A-003's channel note | depot-specific chat and email advice |
| CSV-A-012 | mini_conversation | Quoted the old sentence | quotes the new sentence |
| CSV-A-012 | source_rule | Word-for-word copy of CSV-A-003's source rule | "Explain the real reason behind a rule instead of quoting 'policy', then offer what is possible (derived advice)." |
| CSV-A-012 | mcq_options | Distractor A used the switch "As per policy" | "Our policy does not allow address changes…"; flaw and letter unchanged |
| CSV-A-013 | situation | Broken washing machine is also CSV-I-016's case | faulty dishwasher |
| CSV-A-013 | simple_meaning | Must follow the new appliance | "the new dishwasher" |
| CSV-A-013 | alt_1 | Must follow the new appliance | "the new dishwasher goes out tomorrow" |
| CSV-A-013 | watch_out | ✗ used the switch "any other query?" (B-013's cultural note) as the error | ✗ now genuine errors ("bearing me", tag "okay?") |
| CSV-A-013 | mcq_options | C used the switch "nice day ahead" (B-014's cultural note) without framing; D named the old appliance | C ends "a very nice day."; D "new dishwasher"; flaws and letter unchanged |
| CSV-A-013 | role_play | Must follow the new appliance | faulty dishwasher |
| CSV-A-013 | source_rule | Near-copy of CSV-I-013's close rule | rule specific to closing a hard call (SQM Group kept) |
| CSV-A-014 | source_rule | Word-for-word copy of CSV-B-003's verification rule | privacy rule: holder or authorised user only, explain kindly, offer a way forward |
| CSV-A-014 | mini_conversation | "Mr Rao" is also the caller in CSV-I-005 | Mr Iyer |
| CSV-A-014 | whats_next_reply | The daughter cannot make herself an authorised user; the account holder must sign | "a form your father can sign to make you an authorised user" |
| CSV-A-015 | replies_you_may_hear | Number 4471 is also A-008's order number | 6093 |
| CSV-A-015 | mini_conversation | Same number | 6093 |
| CSV-A-015 | if_customer_pushes | Near-copy of CSV-A-001's pushback answer, and a two-minute silence without asking (rule 1) | "Fair enough. Could you bear with me for two minutes while I open your refund record? Then I'll tell you exactly what's holding it up." |
| CSV-A-017 | situation | The answer promises a 4 pm replacement; the situation did not show the agent could see it | system shows a courier swap can arrive by 4 pm |
| CSV-A-017 | source_rule | "Zendesk etiquette" overstated the source; the "no excuses" point is from Zendesk's chat-etiquette guidance | "(Zendesk chat-etiquette guidance)" |
| CSV-A-017 | hindi_to_english | "naya machine": machine is feminine in Hindi | "nayi machine" |
| CSV-A-019 | whats_next_reply | Near-copy of CSV-B-006's reply | "I'll be back within two minutes, with an answer or an update." |
| CSV-A-019 | mini_conversation | "with the billing team's answer" promises an answer within 15 minutes | "with an update from the billing team" |
| CSV-A-019 | more_formal | Same promise of an answer | "with an update" |
| CSV-A-019 | source_rule | Near-copy of CSV-I-005's long-hold rule | callback instead of another hold, and listen to tone to notice frustration |
| CSV-A-019 | reorder_task + reorder_answer | "Can I call you back" is too close to CSV-I-005's reorder ("or shall I call you back") and only 5 words for C1 | "Would a callback in 15 minutes be easier" (8 words) |

PROGRESS: done cards_VA.txt

Follow-up after re-reading the edited cards:

| ID | field | problem | fix |
|---|---|---|---|
| CSV-A-012 | hindi_roman | Devanagari says "वे इसे", Roman said "woh ise" | "ve ise" |
| CSV-A-012 | positive_swap | "Instead of … say … Instead, I can …" read awkwardly after the sentence change | "After it leaves the warehouse, it's with the courier, but I can ask them to hold it at your local depot." |

PROGRESS: done cards_VA.txt

## Summary

All 60 voice cards (CSV-B/I/A-001 to 020) were re-checked against every round-1 row and then given a fresh pass. Final state: `python3 audit.py cards_VB.txt cards_VI.txt cards_VA.txt` reports no ERROR or warning for these files (the 120 remaining lines are "card missing" for the other channels), and `python3 rules_check.py` lists nothing for any CSV ID. Line counts of the three files are unchanged (56 fields per card, one line each; no id, channel, level, kind, call_stage or speaker touched; MCQ answer letters and option order unchanged).

**Round-1 regressions found: 3** (all in cards_VB.txt): the "fool-name" linking respelling for "full name" (B-002), and two round-1 blanks that accepted a second answer, "afraid" (B-004) and "more" (B-013), now carrying a "(starts with …)" clue. No round-1 fix in cards_VI.txt or cards_VA.txt was found broken.

**New fixes: 150 logged rows** (35 Basic, 44 Intermediate, 71 Advanced), by type:
- 80 repetition and variety across the channel: the same line, mini conversation, reorder task, when-not-to-use, dont_say, cultural note, source rule, memory hook or alt on two or three cards; repeated names (the Basic agent's own name "Priya" reused as a colleague, "Mr Rao", "Anna Brooks"), order numbers and appliances; and three scenarios rebuilt so cards stop sharing a case (B-013 password reset → e-ticket, A-002 "charged twice" → bills to an old address, A-012 third "What I can do is" → "Instead, I can"). This count includes the dependent fields each rebuild had to carry.
- 23 promises made checkable: situations now show what the agent has checked (I-007, I-008, I-009, I-018, A-003, A-017), and promises the agent could not see were softened to commitments in the agent's control ("with an update" instead of "with the outcome", "I'll look into your booking straight away" instead of "I'll sort out your booking" in A-004 with all eight dependent fields).
- 14 service rules: empathy before the reason in pushback answers, specific apologies instead of "I'm sorry about that", thank the caller first on return from hold, ask before a two-minute silence, "No problem" removed from a voice line, and a when-not-to-use that implied the agent might hold a password.
- 13 native wording and consistency fixes (unidiomatic lines, a spoken semicolon, I-003's watch_out ✓, positive_swap and blank now matching the sentence, I-005's callback time matching ask_next).
- 11 Indian-English switches made consistent: removed from watch_out ✗ (A-003, A-011, A-012, A-013), tone notes (B-012, A-012) and unframed MCQ distractors (A-003, A-012, A-013); reframed as "may not expect" in B-003; B-015's mcq_why now treats "I am hearing you" as the stative-verb error it is.
- 4 accuracy fixes (I-014 "double seven" is also standard British; A-014 the account holder signs the authorised-user form; A-009 rule quoted a line not on the card; A-017 source named as Zendesk chat-etiquette guidance).
- 3 Hindi (वे/woh mismatches in I-006 and A-012, "nayi machine" in A-017), 1 pronunciation (A-007 stress line said "come back" for "get back"), 1 MCQ format (B-005 options mixed actions and spoken lines).

**Left as it is on purpose:**
- CSV-I-007 keeps "by next Friday": ask_next names "Friday the twenty-third" (a Friday in 2026, five to seven working days from Wednesday 14 October), the chat note gives the exact date, and the situation now shows the system timeline.
- CSV-I-008 and CSV-A-003 both use "What I can do is…": it is the core positive-language frame, and the Advanced card adds "I'm afraid I'm not able to … as …". The third copy (A-012) was changed.
- CSV-I-006 (warm transfer) and CSV-A-006 (escalation) both promise to brief the colleague first, because plan.txt requires it for both; their wording, alt lines, memory hook and source rule now differ.
- CSV-B-009 (paraphrase) and CSV-I-015 (customer says "charged twice") share a double-charge topic by design of the plan; their lines and questions no longer overlap.
- "Calm down", "No problem" and "our policy does not allow…" remain only inside wrong MCQ options that mcq_why explains (A-001, A-003, A-004, A-012, B-017); rules_check does not flag them.
- Named sources (Lewicki, Polin & Lount; CEB/Gartner; SQM Group; Zendesk; HEARD; LATTE) are kept as citations under rules 30-31, not brands.
- Round-1 decisions kept: feminine slash forms on the speaker's own verbs, and dollars on Intermediate / rupees on some Advanced cards (both plausible for the deck's customers).
- Chat-channel open promise questions (CSC-B-005, CSC-B-014, CSC-B-017) are outside this channel and were not touched.

## Adversarial round 1

| ID | field | problem | fix / decision |
|---|---|---|---|
| CSV-A-019 | alt_2 | "waited far too much" is not idiomatic | APPLIED (modified): "I'm sorry, you've waited long enough already. Let me message the team instead, so you don't need to hold again." The suggested "You're right, you've waited far too long" would copy the signature line of another Advanced card ("You're right, a month is far too long"), so a different idiomatic phrase was used |
| CSV-I-015 | hindi_meaning, hindi_roman | "मुझसे ... पैसे काट लिए गए" is unidiomatic; money is deducted from an account | APPLIED: "एक ही चीज़ के लिए मेरे खाते से दो बार पैसे काट लिए गए हैं।" / "Ek hi cheez ke liye mere khaate se do baar paise kaat liye gaye hain." |
| CSV-I-014 | alt_2 | Says "let me know when you're ready" and then reads the number at once | APPLIED: "I've got a case number for you. Just tell me when you're ready, and I'll read it out slowly." |
| CSV-B-002 | fill_blank | "sir" / "madam" also fit the blank | APPLIED: "Could I have your full name, ____ (starts with p)?" |
| CSV-B-009 | fill_blank | "certain" also fits the blank | APPLIED: "Let me make ____ (starts with s) I have this right: you were charged twice for one order." |
| CSV-I-018 | hindi_to_english_answer | Said Friday 2-6 p.m.; rest of the card says Thursday 9 a.m.-1 p.m. | APPLIED: "Of course. It's due on Thursday, between 9 a.m. and 1 p.m." |
| CSV-A-012 | if_customer_pushes | "I did ask" and "they can hold it" are an invented action and an unseen promise | APPLIED (modified): added an empathy opener, as the round-1 rule requires in pushback answers: "I understand, you want it at your new place. Once a parcel is on the road, the courier can't redirect it. I can ask them to hold it at your local depot, and I'll text you as soon as they confirm." |
| CSV-A-012 | alt_2 | "I can have it held" promises the hold | APPLIED: "... The good news is I can ask them to hold it for you to collect." |
| CSV-A-012 | more_formal | "arrange for it to be held" promises a hold only the courier grants | APPLIED: "... I would, however, be happy to ask the courier to hold it at your local depot." |
| CSV-A-012 | whats_next_reply | Collection code promised before the courier agrees | APPLIED: "The closest one is on Station Road, open 9 am to 7 pm. I'll text you the address now, and the collection code as soon as the courier confirms the hold." |
| CSV-B-011 | alt_1 | "I can sort that out for you" promises a result, against the card's own why_it_works | APPLIED (modified): "Of course, I'm happy to help you with your login." The suggested "help you get back into your account" would repeat alt_2 ("let's get you back into your account") and MCQ option D on the same card |

After the changes: `python3 audit.py cards_VB.txt cards_VI.txt cards_VA.txt | grep -v "card missing"` shows only the summary line (the 120 errors are all "card missing" for other channels); `python3 rules_check.py` reports 0 rule issues. No sentence changed, so no quoting fields needed updates; id/channel/level/kind/call_stage/speaker, MCQ order and answers untouched; line counts unchanged.

## Adversarial round 2

| ID | Field | Finding | Outcome |
|---|---|---|---|
| CSV-A-015 | stress, linking | "absolutely" stressed AB-so-lute-ly; dictionaries give /ˌæbsəˈluːtli/ | APPLIED: stress "THIS is ab-so-LUTE-ly ri-DIC-u-lous"; linking "thi-siz-ab-suh-LOOT-lee" |
| CSV-A-020 | indian_pron_tip, stress, linking | "elsewhere" given the American first-syllable stress; British norm is els-WHERE | APPLIED: tip now gives British els-WHERE and notes American ELS-wair; stress "i'll TAKE my BIZ-nis else-WHERE"; linking "biz-ni-sels-WAIR" |
| CSV-A-018 | linking | "doh-REED" drops the /n/ of "don't" | APPLIED: "dohn-REED" (the t almost disappears) |
| CSV-B-019 | linking | "hang-gon" spells the hard g the card's own tip warns against | APPLIED: "ha-ngon" (the ng slides into "on", no hard g) |
| CSV-B-016 | if_customer_pushes | Agent discloses order history after only a phone number | APPLIED: agent asks for the account email to verify before pulling up recent orders |
| CSV-A-012 | if_customer_pushes | "The courier can't redirect it" is an invented general reason and clashes with the depot-hold offer | APPLIED: "Once the courier has the parcel, I can't change the address from our side. What I can do is ask them to hold it at your local depot..." |
| CSV-I-007 | situation | "by next Friday at the latest" only holds for a refund processed on a known day; ask_next/channel_note assume Wednesday 14 October | APPLIED: situation now opens "It is Wednesday, and you have just processed a refund; ..." (Wed 14 Oct + 7 working days = Fri 23 Oct) |

After the changes: audit.py shows only the summary line (all errors are "card missing" for other channels); rules_check.py reports no issues. No sentence changed; id/channel/level/kind/call_stage/speaker, MCQ order and answers untouched.

## Adversarial round 3

| ID | Field | Finding | Outcome |
|---|---|---|---|
| CSV-A-017 | fill_blank | Machine arrives by 4 pm, so "take payments again this evening" understates the fix | APPLIED: "...by 4 pm ____, so you can take card payments again this afternoon." (fill_answer "today" unchanged) |
| CSV-A-016 | if_customer_pushes | "I'll stay in touch until it arrives" is an open-ended promise with no time (rule 9) | APPLIED: "...Let's get your sofa replaced first. I'll text you the delivery slot by 6 pm today, and I'll call you the day after it arrives to check everything is fine." |

No other field quotes either changed text; id/channel/level/kind/call_stage/speaker, MCQ order and answers untouched.

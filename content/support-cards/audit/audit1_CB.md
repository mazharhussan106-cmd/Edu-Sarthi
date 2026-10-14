# Audit round 1 - CSC-B (Chat · Basic) - reviewer log

Reviewer pass over cards_CB.txt (CSC-B-001 to CSC-B-020). One row per real change.

| ID | field | problem | fix |
|---|---|---|---|
| CSC-B-001 | linking | "I'm Ananya" respelt "aim-a-NAN-ya" showed no linking | respelt "ai-ma-NAN-ya" and noted that the "m" joins the next vowel |
| CSC-B-001 | watch_out | "Myself Ananya" is Indian-English-only phrasing; the brief allows it only in cultural_note/dont_say/positive_swap, never labelled an error | replaced with two universal learner errors (thanks for contact; "How I can help you?") |
| CSC-B-001 | fill_blank | "thanks for ____ [Company]" also fits "choosing"/"messaging", so the answer was not unambiguous | added the verb hint (contact); answer stays "contacting" |
| CSC-B-001 | mcq_options | correct option was the only full sentence and far the longest; distractors were stubs and used "Myself"/"kindly" | four similar-length realistic options (blunt, robot template, ALL CAPS); correct C unchanged |
| CSC-B-001 | mcq_why | did not cover the new options | rewritten to explain A, B and D |
| CSC-B-001 | hindi_to_english | Hindi prompt had no "aaj" but the model answer says "today" | added "aaj" to the prompt |
| CSC-B-001 | whats_next_reply | "it hasn't arrived" was vague for a refund apology | "I'm sorry your refund hasn't arrived yet…" (specific apology) |
| CSC-B-001 | self_check | quoted "Myself"/"Dear Customer" outside the allowed fields | rephrased as three positive checks |
| CSC-B-002 | linking | "number_here" is not a real link (r then h) | replaced with "confirmation_email" → "con-fir-MAY-shu-nee-mail" (n joins the vowel) |
| CSC-B-002 | indian_pron_tip | "retroflex" is jargon for an A2/B1 learner | explained as "tongue just behind the top teeth, not curled back" |
| CSC-B-002 | watch_out | "Please share me…" is Indian-English phrasing shown as an error | replaced with a universal learner error (adverb before object: "type here your order number") |
| CSC-B-002 | alt_2 | "What's your order number?" had no please and was blunt, which the card itself warns against | "Could I have your order number, please? …" |
| CSC-B-002 | more_formal | verification did not state its purpose (rule 5) | added "so that I can locate your order" |
| CSC-B-002 | mcq_options | correct option far the longest; distractors were stubs; "share me" used as a distractor | four similar-length options (order, shorthand, ALL CAPS); correct C unchanged |
| CSC-B-002 | mcq_why | named "share me"/Indian English | rewritten for the new A, B, D |
| CSC-B-003 | linking | "let_me → lem-mee" is a casual contraction, not neutral linking; "check_that" had no guidance | "let-mee" with a light t; "k" touched before "th" |
| CSC-B-003 | watch_out | used "the same" as a pronoun (Indian-English-only phrasing) as an error | replaced with a real learner error ("Let me to check…") |
| CSC-B-003 | fill_blank / fill_answer | "Let me ____ that for you" fits check/confirm/verify/see | blank moved to "____ me check that for you"; answer "Let" |
| CSC-B-003 | mcq_question | "five minutes" in the question matched "five minutes" in B, so it was answerable by matching | question now says "a few minutes"; B says "about three minutes" |
| CSC-B-003 | mcq_options | correct option far the longest; "Checking the same, sir" used banned phrasing as a distractor | four similar-length options (only a moment / about three minutes / bare order / vague) ; correct B unchanged |
| CSC-B-003 | mcq_why | matched the old options | rewritten for the new A, C, D |
| CSC-B-003 | whats_next_reply | repeated the "thanks for waiting" return line already in ask_next and mini_conversation | now a status update with a real time ("in about a minute") |
| CSC-B-004 | indian_pron_tip | no minimal pair; "varehouse" is not a word | added west/vest minimal pair with the mouth instruction |
| CSC-B-004 | hindi_roman | "godown" did not match Devanagari गोदाम | "godaam" |
| CSC-B-004 | tone_note | quoted "Sorry for delay in reply" (Indian-English template) outside the allowed fields | replaced with the "Yes, I checked" example already in dont_say |
| CSC-B-004 | cultural_note | described a chat/phone mix-up, not an Indian-English habit | now names "Kindly bear with us" / "Thanks for being on hold" and gives the switch |
| CSC-B-004 | when_not_to_use | described when to add something, not when the line is wrong | "Do not use a thank-you alone after a very long wait; add an apology…" |
| CSC-B-004 | mcq_options | option C ("Thanks for being on hold") was arguably acceptable, so not one defensible answer; D was implausible | four similar-length options (thank + news, no answer, blames another chat, news without thanks) ; correct A unchanged |
| CSC-B-004 | mcq_why | claimed "there is no hold in chat" | rewritten for the new options |
| CSC-B-005 | linking | did not explain the join of "arrived" + "damaged" | added "(the two "d" sounds join into one)" |
| CSC-B-005 | watch_out | "Sorry for the inconvenience caused" is a vague template, not a learner mistake (it is already in positive_swap/cultural_note) | real learner error: "I'm sorry for your order arrived damaged." |
| CSC-B-005 | more_formal | "arrange a replacement for dispatch today" is clumsy | "arrange for a replacement to be dispatched today" |
| CSC-B-005 | mini_conversation | return question and answer repeated whats_next | turn 3 now asks about delivery time; return question stays in whats_next |
| CSC-B-005 | whats_next_reply | repeated the delivery sentence from the mini conversation | now answers only the return question |
| CSC-B-005 | mcq_options | correct option far the longest; distractors were stubs | four similar-length options (template, correct, emoji with no fix, excuse) ; correct B unchanged |
| CSC-B-005 | mcq_why | did not cover the new options | rewritten for A, C, D |
PROGRESS: done through CSC-B-005
| CSC-B-006 | linking | "error_message" and "what's_happening" respellings were not real links ("wot-sap-ning" dropped the h) | "of_the_error → uv-thee-ER-ror" (the before a vowel) and "what's_happening → wots-HAP-ning" |
| CSC-B-006 | watch_out | used "Kindly" and "the same" (Indian-English-only phrasing) as an error | replaced with a universal learner error (missing articles) |
| CSC-B-006 | if_customer_pushes | the "pushback" was a how-to question, which duplicated whats_next | real pushback ("why a screenshot?") answered with a specific apology and the reason |
| CSC-B-006 | source_rule | quoted a canned-response rule that does not match this card | now the "Could you…?" + reason + short message rule (rules 12 and 16) |
| CSC-B-006 | fill_blank | "send me a ____ of the error message" also fits picture/photo | added a hint (one word for a picture of your screen) |
| CSC-B-006 | mcq_options | correct option clearly the longest; A and D were implausible | four similar-length, equally plausible purposes; correct B unchanged |
| CSC-B-006 | mcq_why | did not cover the new options | rewritten for A, C, D |
| CSC-B-006 | whats_next_reply | "on most phones" is wrong for iPhones | gives the Android and iPhone button combinations |
| CSC-B-006 | self_check | quoted "of the same" (Indian-English phrasing) | replaced with "did you name exactly what to send" |
| CSC-B-007 | watch_out | "Kindly… do the needful" shown as an error | replaced with real learner errors ("in this link", "fill your email") |
| CSC-B-007 | alt_1 | promised a "reset code", which blurs the line with an OTP | "we'll email you a link to choose a new password" |
| CSC-B-007 | if_customer_pushes | "Sorry about that" was vague | "I'm sorry the link isn't opening" (specific apology) |
| CSC-B-007 | fill_blank | "enter" competes with "type" (alt_2 uses it) | added the hint "starts with e" |
| CSC-B-007 | mcq_options | correct option the longest; C and D were silly | four similar-length plausible options; correct B unchanged |
| CSC-B-007 | mcq_why | did not cover the new options | rewritten for A, C, D |
| CSC-B-007 | hindi_to_english | prompt lacked "bas" and "address" that the answer uses | prompt and answer now match |
| CSC-B-007 | self_check | quoted "go through the below link" | replaced with "did you say what the link is for" |
| CSC-B-008 | cultural_note | said "Hindi word order" but it is the "chahte hain ki" pattern | corrected the description |
| CSC-B-008 | ask_next | repeated the confirmation line already in mini_conversation | now asks whether to add a flat number or landmark |
| CSC-B-008 | if_customer_pushes | no apology before the action to a slightly annoyed customer | "I'm sorry to ask twice, Sarah…" |
| CSC-B-008 | fill_blank / fill_answer | "Just to ____" fits confirm/check/clarify | blank moved to "delivery ____"; answer "address" |
| CSC-B-008 | mcq_question / mcq_options | question gave no address, so options quoted an address from nowhere; correct option the longest; D repeated the watch_out error | question quotes the customer's message; four similar-length options |
| CSC-B-008 | mcq_why | did not cover the new options | rewritten for A, B, D |
| CSC-B-008 | hindi_to_english | prompt had no "bas" and no word for "change", the answer has both | "Bas confirm karne ke liye… badalkar…" |
| CSC-B-008 | whats_next_reply | "I'll update it now" skipped the confirmation the card teaches | re-confirms the corrected address ("Is that right?") |
| CSC-B-009 | ask_next | the warning gave the customer no way to keep the chat open | "just reply here and I'll keep it open" |
| CSC-B-009 | mcq_options | A and C were implausible (stubs, caps) | four similar-length plausible options; correct B unchanged |
| CSC-B-009 | mcq_why | did not cover A and C | rewritten for A, C, D |
| CSC-B-010 | watch_out | "Welcome." is an Indian-English habit shown as an error | replaced with a universal learner error ("You welcome", "thanks for chat") |
| CSC-B-010 | ask_next | "Take care!" repeated in mini_conversation and whats_next | now an open-door line ("message us again any time") |
| CSC-B-010 | mcq_options | correct option far the longest; distractors were stubs and one was the Indian-English reply | four similar-length options (system message, ALL CAPS, new question, correct D) |
| CSC-B-010 | mcq_why | named Indian English | rewritten for A, B, C |
| CSC-B-010 | whats_next_reply | identical to CSC-B-019 and to the mini conversation | "Thanks, Sarah. Bye for now!" |
| CSC-B-010 | self_check | quoted "not just Welcome" | rephrased positively |
PROGRESS: done through CSC-B-010
| CSC-B-011 | linking | "anything_else → en-ee-thing-gels" adds a hard g, which contradicts the "no hard g" tip on CSC-B-015; "glad_that's" showed no link | "that's_sorted" (two s sounds join) and "en-ee-thing-els" (no hard g) |
| CSC-B-011 | watch_out | "Any other query?" is Indian-English phrasing shown as an error | universal learner error: "help you today" (missing "with") |
| CSC-B-011 | ask_next | repeated the close of CSC-B-010 and of the mini conversation | open-door line ("if it stops working again, just message us here") |
| CSC-B-011 | fill_blank / fill_answer | "anything" competes with "something" | blank moved to "help you ____ today"; answer "with" (ties to the watch_out) |
| CSC-B-011 | whats_next_reply | duplicated the mini-conversation close | "Great. I'll close the chat now…" |
| CSC-B-011 | self_check | quoted "Any other query?" | replaced with a check on "help you with today" |
| CSC-B-012 | indian_pron_tip | said the final "t" separates "won't" from "want"; the difference is the vowel | long "oh" (like "own" + t) instead |
| CSC-B-012 | watch_out | "concerned team" (Indian-English-only phrasing) shown as an error | universal learner error ("they can to change") |
| CSC-B-012 | fill_blank | "won't need to ____ anything" fits explain/say as well as repeat | added the hint "starts with r" |
| CSC-B-012 | mcq_options | correct option far the longest; distractors were stubs and one used "concerned team" | four similar-length options; correct C unchanged |
| CSC-B-012 | mcq_why | did not cover the new options | rewritten for A, B, D |
| CSC-B-013 | linking | "wo-tap-pend" drops the h of "happened" and "bit_more" is not a link | "wot-HAP-nd" (keep the h); "first_notice" light t |
| CSC-B-013 | watch_out | "Please elaborate your issue" is Indian-English phrasing shown as an error | universal error ("what did happen") that matches the grammar note |
| CSC-B-013 | alt_1 | "Sorry to hear that" is a vague apology | "I'm sorry the app isn't working." |
| CSC-B-013 | if_customer_pushes | "I understand" did not name the feeling | "I know that's frustrating…" |
| CSC-B-013 | mini_conversation | same vague apology | specific apology |
| CSC-B-013 | fill_blank | "what ____" fits happened/occurred/happens | added the hint "past tense of happen" |
| CSC-B-013 | mcq_options | correct option clearly the longest; B and D were stubs; A was Indian-English phrasing | four similar-length plausible options; correct C unchanged |
| CSC-B-013 | mcq_why | named Indian English | rewritten for A, B, D |
| CSC-B-013 | whats_next_reply | repeated ask_next | a further clarifying question |
| CSC-B-014 | memory_hook | said "parcel" but the item is a card | "card" |
| CSC-B-014 | if_customer_pushes | the "what if it doesn't come" question duplicated whats_next, and the reply promised another card "straight away" | new pushback about the long chat, with a specific apology and the reason |
| CSC-B-014 | fill_blank | "Thank you for your ____" fits time/help/understanding | added the hint "the noun for waiting calmly" |
| CSC-B-014 | mcq_why | did not explain "up to Friday" | added |
| CSC-B-014 | whats_next_reply | promised a replacement card the agent may not be able to send | "we'll look into it straight away" |
| CSC-B-015 | watch_out | "State your query" shown as an error | universal learner error ("help to you") |
| CSC-B-015 | cultural_note | said Indian and international customers behave the same, so it gave no contrast | now about agents replying "sir"/"madam" to everyone |
| CSC-B-015 | mini_conversation | "I'm sorry to hear that" is vague | "I'm sorry your parcel hasn't arrived." |
| CSC-B-015 | fill_blank | "How can I ____ you" also fits "assist" | added the hint "starts with h" |
| CSC-B-015 | mcq_options | correct option the longest; B and D were stubs | four similar-length plausible options; correct A unchanged |
| CSC-B-015 | mcq_why | did not cover B and C | rewritten |
| CSC-B-015 | hindi_to_english | prompt was an instruction about the task, not a line to translate | now a real Hindi line that translates to the model answer |
PROGRESS: done through CSC-B-015
| CSC-B-016 | indian_pron_tip | "retroflex" is jargon for an A2 learner, and "or-dar" muddled the tip | plain mouth instruction (tongue behind the top teeth, soft "uh" ending) |
| CSC-B-016 | if_customer_pushes | the agent revealed order details ("two recent orders… Monday") to an unverified customer | asks what was ordered or roughly when, after looking up by email |
| CSC-B-016 | cultural_note | "Indian customers write…" generalised a whole group | "Some customers write… (a common Indian-English style)" |
| CSC-B-016 | fill_blank | "order ____" also fits ID/details | added the hint "starts with n" |
| CSC-B-016 | mcq_question / mcq_options | correct option far the longest; B, C, D were stubs | question asks for the best first reply; four similar-length agent replies; correct A unchanged |
| CSC-B-016 | mcq_why | did not cover C and D | rewritten |
| CSC-B-016 | hindi_to_english | prompt was an instruction about the task, not a line to translate | real Hindi line that translates to the model answer |
| CSC-B-017 | watch_out | "Sorry for the inconvenience caused" is a template, not a learner mistake (kept in cultural_note) | real learner errors (missing article, awkward question) |
| CSC-B-017 | if_customer_pushes | identical to whats_next (free return) | new pushback ("why did you send the wrong thing?") with an honest "I don't know yet" |
| CSC-B-017 | fill_blank | "you ____ the wrong item" also fits "got" | hint: the customer misspelt this word |
| CSC-B-017 | mcq_options / mcq_why | A, C were implausible; the options did not test a real mistake | four plausible options (spelling correction, "check again", warehouse explanation, correct D); why rewritten |
| CSC-B-017 | hindi_to_english | prompt was an instruction | real Hindi line (with "uski jagah" for "instead") |
| CSC-B-018 | hindi_roman | "Please" did not match Devanagari कृपया | "Kripya" |
| CSC-B-018 | if_customer_pushes | no time given | "I'll update you in two minutes" |
| CSC-B-018 | cultural_note | said there is no difference, so no contrast | now: some agents copy shorthand back; international customers expect full words |
| CSC-B-018 | mini_conversation | vague "that's worrying"; repeated whats_next_reply word for word | specific apology and a different question |
| CSC-B-018 | fill_blank / fill_answer | "What's ____?" fits wrong/happened/happening | blank moved to "I'll ____ you"; answer "help" with hint |
| CSC-B-018 | mcq_options / mcq_why | A-C were invented, silly expansions | four real "as … as possible" phrases; correct D unchanged |
| CSC-B-018 | hindi_to_english / answer | prompt was an instruction; answer duplicated ask_next | real Hindi line and a different model answer |
| CSC-B-019 | indian_pron_tip | repeated the "thanks" tip from CSC-B-001; the reply in this card contains "welcome" | v/w tip for "welcome" (west/vest) |
| CSC-B-019 | watch_out | "Welcome." is an Indian-English habit shown as an error | agent copying shorthand and sending a system line |
| CSC-B-019 | if_customer_pushes | "Good question!" and "next Friday" contradicted the mini conversation | "Of course. It should reach your account by Friday." |
| CSC-B-019 | fill_blank | "Glad I could ____" also fits "assist" | hint "starts with h" |
| CSC-B-019 | mcq_options / mcq_why | correct option the longest; B and D were stubs | similar-length options; correct A unchanged; why rewritten |
| CSC-B-019 | reorder_task / reorder_answer | only 4 words (audit error: needs 5+) | "You're welcome Sarah Glad I could help" (7 words) |
| CSC-B-019 | hindi_to_english | prompt was an instruction | real Hindi line |
| CSC-B-019 | whats_next_reply | duplicated the CSC-B-010 closing line | "Bye for now, Sarah. Take care!" |
| CSC-B-020 | indian_pron_tip | "no strong r in British English" is not a trap for the learner | "here" vs "hair" and the voiced "th" in "there" |
| CSC-B-020 | cultural_note | tied "I am there" to "main hoon" without saying why it fails | explains that Hindi does not mark here/there |
| CSC-B-020 | if_customer_pushes | identical to whats_next | new pushback with empathy, apology and a time |
| CSC-B-020 | fill_blank | "I'm ____" also fits "back" | hint: the opposite of "there" |
| CSC-B-020 | mcq_options | option C ("close the chat") was implausible | "speak to a different agent straight away" |
| CSC-B-020 | hindi_to_english | prompt was an instruction | real Hindi line |
PROGRESS: done through CSC-B-020
| CSC-B-005 | tone_note / self_check | quoted "inconvenience caused" (Indian-English wording) outside the allowed fields | now the universal template wording "Sorry for the inconvenience" (the wording rule 8 itself uses) |
| CSC-B-018 | mcq_why | contrived clause explaining why option C is tempting | now names what the "s" stands for and why the three distractors are wrong |
| CSC-B-016 | whats_next_reply | "I'm sorry it hasn't arrived" was vague | "I'm sorry your order hasn't arrived." |

## Summary

All 20 cards (CSC-B-001 to CSC-B-020) were reviewed against checklist A to I. The log has 138 change rows (a row can cover two or three fields of one card), applied through four scripted batches in which every replacement was asserted to match exactly once. By type: 35 MCQ fixes (the correct option was clearly the longest in 13 of 20 cards, now 0 against the limit of 6; distractors were stubs or Indian-English phrasing; one question was answerable by matching "five minutes"; one gave no address to quote); 15 fill-in-the-blank fixes (blanks that had two or more natural answers, such as contacting/choosing, check/confirm, patience/time, now carry a hint or test a different word); 26 fixes to Indian-English framing and notes (phrases such as "Kindly", "the same", "concerned team", "Myself", "share me" and "Any other query?" were shown as errors in watch_out, MCQ options or self_check; they now appear only in cultural_note, dont_say and positive_swap, and watch_out uses universal learner errors); 13 pronunciation fixes (an "en-ee-thing-gels" linking that taught a hard g and contradicted CSC-B-015, linking that showed no real join, "retroflex" jargon at A2, a "won't"/"want" tip that named the wrong difference, v/w and here/hair minimal pairs added); 11 Hindi fixes (godown/godaam and Please/Kripya mismatches, and six "Say it in English" prompts in the Understand cards (CSC-B-015 to 020) that were instructions rather than lines to translate); 1 reorder fix (CSC-B-019 had only 4 words); 37 other content fixes (vague "Sorry to hear that" apologies made specific, repeated lines inside a card and across CSC-B-010 and CSC-B-019 removed, an order disclosed to an unverified customer, a "reset code" that blurred the OTP rule, a replacement promised that an agent may not be able to send, "on most phones" screenshot advice corrected for iPhone, a mismatched source_rule in CSC-B-006).

The mechanical audit reports no error or warning for any CSC-B ID (only the expected 160 "card missing" lines for other groups). Correct-answer letters are unchanged (A 5, B 5, C 5, D 5), and no option was reordered.

Open points for a later round: the CSC-B-014 sentence promises "will arrive by Friday" as a firm date (kept, because it is the plan's teaching point and alt_1 gives the "should arrive" version); CSC-B-005 and CSC-B-017 promise a free replacement or return as if the agent were authorised to offer it.

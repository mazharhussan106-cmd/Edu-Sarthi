# Audit round 1 - cards_VB.txt (Voice - Basic, CSV-B-001 to CSV-B-020)

Tags in the problem column: [English] wording/grammar/spelling, [Accuracy] service rule or honesty, [Understand] understand-it content, [Hindi], [Pron] pronunciation fields, [MCQ] options/question/why, [Practice] other practice fields, [Dup] duplicate or consistency.

| ID | field | problem | fix |
|---|---|---|---|
| CSV-B-001 | indian_pron_tip | [Pron] only the voiceless pair was given, but "this" has a voiced th | added the voiced minimal pair then / den |
| CSV-B-001 | simple_meaning | [English] "Tell me what you need" reads like an order, against the card's own teaching | replaced with a polite question |
| CSV-B-001 | replies_you_may_hear | [English] a reply to "How can I help you?" does not start with "Yes" | removed "Yes," |
| CSV-B-001 | fill_blank | [Practice] "calling" is not the only fit (phoning, contacting), so the blank was ambiguous | blank is now "for", which has one answer |
| CSV-B-001 | fill_answer | [Practice] answer follows the new blank | fill_answer = for |
| CSV-B-001 | mcq_question | [MCQ] option B also names the company, the agent and an offer of help, so "everything they need" had two readings | question now asks for the clear, natural opening |
| CSV-B-001 | mcq_options | [MCQ] the correct option was by far the longest and the distractors were not realistic openings | four openings of 68-75 characters, each with a real flaw |
| CSV-B-001 | mcq_why | [MCQ] why-text must match the new options | rewritten for options A-D |
| CSV-B-001 | hindi_to_english | [Hindi] the prompt had no "aaj" but the model answer says "today" | added "aaj" so the prompt and the answer match |
| CSV-B-002 | linking | [Pron] "(one smooth l)" says nothing about how the words join (there is only one l) | replaced with a real linking instruction |
| CSV-B-002 | memory_hook | [English] "visiting card" is Indian English; international learners say "business card" | business card |
| CSV-B-002 | dont_say | [Accuracy] "comes from" states an etymology as fact | softened to "echoes" |
| CSV-B-002 | if_customer_pushes | [Accuracy] pushback answer had no empathy line before the reason, and "just a second" is a vague time | empathy line, then the purpose |
| CSV-B-002 | source_rule | [Accuracy] the sentence does not state a purpose, so the rule as written did not match the line | rule now matches the card (purpose is given in the pushback answer) |
| CSV-B-002 | fill_blank | [Practice] "have" is not the only fit ("Could I get..." is natural), so the blank was ambiguous | blank is now "please" |
| CSV-B-002 | fill_answer | [Practice] answer follows the new blank | fill_answer = please |
| CSV-B-002 | mcq_options | [MCQ] distractors were fragments ("Your name?") and not realistic | four full lines of similar length, each with a real flaw |
| CSV-B-002 | mcq_why | [MCQ] why-text must match the new options | rewritten for options A-D |
| CSV-B-002 | whats_next_reply | [Dup] near-identical to ask_next (both ask for the surname spelling) | now a spelling read-back, a different move |
| CSV-B-003 | intonation | [Pron] a fall after the opening clause signals the sentence has ended; the clause needs a level or slight rise | corrected the intonation of the opening clause |
| CSV-B-003 | watch_out | [Dup] the corrected version did not match the card's sentence | ✓ part now quotes the full sentence |
| CSV-B-003 | channel_note | [Accuracy] security rule was incomplete; OTP and PIN are the most common traps | added PIN and OTP |
| CSV-B-003 | fill_blank | [Practice] "protect" is not the only fit ("secure" works too), so the blank was ambiguous | blank is now "To", the purpose marker the card teaches |
| CSV-B-003 | fill_answer | [Practice] answer follows the new blank | fill_answer = To |
| CSV-B-003 | mcq_options | [MCQ] the correct option was three times longer than the distractors, a giveaway | distractors are now full, realistic verification lines of 78-91 characters |
| CSV-B-003 | mcq_why | [MCQ] why-text must match the new options | rewritten for options A-D |
| CSV-B-003 | whats_next_reply | [English] "I'm sure you are" can sound sarcastic in British English, and there was no empathy line | empathy line, then the reason |
| CSV-B-004 | linking | [Pron] "cat-chat" drops the "th" of "that", which contradicts the Indian speaker tip and trains the wrong sound | replaced with a real vowel-to-vowel link |
| CSV-B-004 | indian_pron_tip | [Pron] "Hindi has no th sound" is misleading (Hindi writes th for an aspirated t), and "dis" is not a minimal pair | precise wording and a proper minimal pair |
| CSV-B-004 | memory_hook | [English] "dropped the ball" means failing at a duty, which does not fit; the catch image is better | rewritten around "catch" |
| CSV-B-004 | cultural_note | [Accuracy] "Come again?" is ordinary casual English, not an Indian-English habit | replaced with "Repeat once more" |
| CSV-B-004 | fill_blank | [Practice] "catch" is not the only fit ("hear", "get"), so the blank was ambiguous | blank is now "sorry", which fits the card's apologise-first point |
| CSV-B-004 | fill_answer | [Practice] answer follows the new blank | fill_answer = sorry |
| CSV-B-004 | mcq_options | [MCQ] the correct option was the longest and the distractors were short fragments | four full replies of 63-67 characters |
| CSV-B-004 | whats_next_reply | [Dup] near-identical to ask_next (both read the digits back) | now moves on to the lookup |
| CSV-B-005 | fill_blank | [Practice] "spell" is not the only fit ("confirm ... for me" is natural), so the blank was ambiguous | blank is now "address", which also checks the "email address, not email ID" point |
| CSV-B-005 | fill_answer | [Practice] answer follows the new blank | fill_answer = address |
| CSV-B-005 | mcq_options | [MCQ] the correct option was the longest and the distractors were short fragments | four full replies of 44-60 characters |
| CSV-B-005 | mcq_why | [MCQ] why-text must match the new options | rewritten for options A-D |
| CSV-B-005 | mini_conversation | [Accuracy] the card's own rule is to read the email back, but the conversation ended without a read-back | last turn now reads the email back |
| CSV-B-005 | whats_next_customer | [Practice] the follow-up spelled a first name, but the card is about an email address | customer now spells an email address |
| CSV-B-005 | whats_next_reply | [Practice] reply must answer the new customer line and read the email back | reads the email back and checks |

PROGRESS: done through CSV-B-005

| ID | field | problem | fix |
|---|---|---|---|
| CSV-B-006 | intonation | [Pron] the intonation note quotes "I'll check that for you", which is not in this card's sentence | now quotes the real second sentence |
| CSV-B-006 | if_customer_pushes | [Accuracy] rule 7: the pushback answer went straight to the reason with no empathy line | empathy line first, then the reason and the time |
| CSV-B-006 | fill_blank | [Practice] "Could" is not the only fit (Can, Would, Will all work), so the blank was ambiguous | blank is now "for", which has one answer |
| CSV-B-006 | fill_answer | [Practice] answer follows the new blank | fill_answer = for |
| CSV-B-006 | mcq_options | [MCQ] the correct option was far longer than the fragments, a giveaway | four full lines of 68-74 characters, each with a real flaw |
| CSV-B-006 | mcq_why | [MCQ] why-text must match the new options | rewritten for options A-D |
| CSV-B-006 | hindi_to_english | [Hindi] the prompt had no "lagbhag" but the model answer says "about two minutes" | added "lagbhag" |
| CSV-B-007 | fill_blank | [Practice] "holding" is not the only fit ("waiting" works), so the blank was ambiguous | blank is now "way" (fixed idiom), which also drills the w sound |
| CSV-B-007 | fill_answer | [Practice] answer follows the new blank | fill_answer = way |
| CSV-B-007 | mcq_options | [MCQ] the correct option was by far the longest and the distractors were fragments | four full lines of 56-66 characters, each with a real flaw |
| CSV-B-007 | mcq_why | [MCQ] why-text must match the new options | rewritten for options A-D |
| CSV-B-007 | whats_next_reply | [Dup] repeats ask_next and the mini conversation almost word for word | different wording for the same fact |
| CSV-B-008 | stress | [Pron] "ar-RIVED" suggests an r sound that is not in the word's first syllable | a-RIVED |
| CSV-B-008 | linking | [Pron] linking said the final d melts away, which contradicts the speaker tip to keep it; "wo-tap-pend" drops the h of a content word | d is kept; replaced the second pair with a genuine t-to-vowel link |
| CSV-B-008 | why_it_works | [Accuracy] this line offers repair but does not take responsibility, and the claim did not match the study's ranking | states the ranking correctly and shows how to add responsibility |
| CSV-B-008 | watch_out | [Dup] watch_out repeated dont_say word for word instead of showing a learner mistake | now a real learner error; the correction quotes the full sentence |
| CSV-B-008 | fill_blank | [Practice] "find" is not the only fit ("figure out", "work out"), so the blank was ambiguous | blank is now "out" (particle of the phrasal verb) |
| CSV-B-008 | fill_answer | [Practice] answer follows the new blank | fill_answer = out |
| CSV-B-008 | mcq_options | [MCQ] the correct option was more than twice as long as the distractors, a giveaway | distractors are full, realistic replies of 83-84 characters |
| CSV-B-008 | mcq_why | [MCQ] why-text must cover the new option C | added C |
| CSV-B-008 | hindi_to_english | [Hindi] "Mujhe maaf kijiye ki" is not natural Hindi for an apology | natural wording, matching the card's hindi_meaning |
| CSV-B-008 | hindi_to_english_answer | [Hindi] "der se aaya" means "came late" | answer matches the prompt |
| CSV-B-009 | hindi_meaning | [Hindi] "आपसे ... पैसे कटे" is ungrammatical (money is deducted from "आपके" account) | natural Hindi |
| CSV-B-009 | hindi_roman | [Hindi] Roman line must match the corrected Devanagari | updated to match |
| CSV-B-009 | linking | [Pron] "charj-twice" drops the d, which contradicts the speaker tip on this very word | keeps a quick d |
| CSV-B-009 | alt_2 | [English] "two times" is less natural than "twice" | twice |
| CSV-B-009 | if_customer_pushes | [Accuracy] rule 7: the pushback answer had no empathy line and could sound defensive | added an apology and acknowledgement first |
| CSV-B-009 | mcq_options | [MCQ] distractors were short fragments; B was not a realistic choice | four full options of 58-64 characters |
| CSV-B-009 | mcq_why | [MCQ] why-text must cover option D | added D |
| CSV-B-009 | record_task | [Practice] the example was in the third person ("The customer ordered..."), but the agent speaks to the customer as "you" | task now asks for "you" |
| CSV-B-010 | fill_blank | [Practice] "find" is not the only fit ("see" works), so the blank was ambiguous | blank is now "in" |
| CSV-B-010 | fill_answer | [Practice] answer follows the new blank | fill_answer = in |
| CSV-B-010 | mcq_options | [MCQ] the correct option was far longer than the fragments, a giveaway | four full lines of 66-82 characters; B is polite but does not say where to look |
| CSV-B-010 | mcq_why | [MCQ] why-text must match the new options | rewritten for B |
| CSV-B-010 | whats_next_customer | [Dup] repeats the whole scenario of CSV-B-019 ("Hang on... let me find it" / "Of course, take your time") | a different, useful follow-up |
| CSV-B-010 | whats_next_reply | [Dup] near-identical to CSV-B-019's ask_next | answers the new question and offers a backup |

PROGRESS: done through CSV-B-010

| ID | field | problem | fix |
|---|---|---|---|
| CSV-B-001 | watch_out | [English] the brief frames Indian-English forms as switches, never errors; a watch_out cross (x) marks an error, so it must show a genuine learner mistake ("myself Priya") | now "calling to" and the word order "How I can"; the correction quotes the full line |
| CSV-B-001 | mcq_question | [MCQ] question must fit the new distractors | now asks for the most welcoming, complete opening |
| CSV-B-001 | mcq_options | [MCQ] distractor used an Indian-English-only form; the brief allows those only in cultural_note, dont_say and positive_swap ("myself Priya") | B is now a blunt but ordinary opening |
| CSV-B-001 | mcq_why | [MCQ] why-text must match the new options | rewritten for options A-D |
| CSV-B-002 | watch_out | [English] the brief frames Indian-English forms as switches, never errors; a watch_out cross (x) marks an error, so it must show a genuine learner mistake ("good name") | now a genuine learner error (missing "me", less polite) |
| CSV-B-002 | mcq_options | [MCQ] distractor used an Indian-English-only form; the brief allows those only in cultural_note, dont_say and positive_swap ("good name", "then only") | plain orders and a condition instead |
| CSV-B-002 | mcq_why | [MCQ] why-text must match the new options | rewritten for options A-D |
| CSV-B-003 | watch_out | [English] the brief frames Indian-English forms as switches, never errors; a watch_out cross (x) marks an error, so it must show a genuine learner mistake ("then only") | now "For protect" and missing "your"; this also matches the fill-in blank ("To") |
| CSV-B-004 | watch_out | [English] the brief frames Indian-English forms as switches, never errors; a watch_out cross (x) marks an error, so it must show a genuine learner mistake ("Repeat once more") | now the stative-verb error "I am not understanding" (rule 26) |
| CSV-B-004 | mcq_options | [MCQ] distractor used an Indian-English-only form; the brief allows those only in cultural_note, dont_say and positive_swap ("not audible") | plain blaming line |
| CSV-B-005 | watch_out | [English] the brief frames Indian-English forms as switches, never errors; a watch_out cross (x) marks an error, so it must show a genuine learner mistake ("email ID") | now a genuine learner error ("Please spelling") |
| CSV-B-007 | watch_out | [English] the brief frames Indian-English forms as switches, never errors; a watch_out cross (x) marks an error, so it must show a genuine learner mistake ("the same") | now "for hold" and the wrong tense "I am finding" (the card teaches "I've found") |
| CSV-B-008 | mcq_options | [MCQ] "inconvenience caused" is the Indian-script form; the plain cliche is enough for the distractor | removed "caused" |
| CSV-B-009 | watch_out | [English] the brief frames Indian-English forms as switches, never errors; a watch_out cross (x) marks an error, so it must show a genuine learner mistake ("You are telling that") | now a genuine agreement error ("you was"); the correction quotes the full line |
| CSV-B-010 | watch_out | [English] the brief frames Indian-English forms as switches, never errors; a watch_out cross (x) marks an error, so it must show a genuine learner mistake ("order ID", "then only") | now a genuine verb-form and article error |
| CSV-B-011 | stress | [Pron] "can" is weak (kn) in an affirmative sentence; stressing CAN changes the meaning and is a common Indian-speaker habit | stress moved to HELP; the weak form is shown in the linking field |
| CSV-B-011 | linking | [Pron] linking did not show the weak "can" | added I_can |
| CSV-B-011 | watch_out | [English] the brief frames Indian-English forms as switches, never errors; a watch_out cross (x) marks an error, so it must show a genuine learner mistake ("try my level best") | now a preposition error ("help you for") plus the unsure "try" |
| CSV-B-011 | fill_blank | [Practice] "help" is not the only fit ("assist"), so the blank was ambiguous | blank is now "with" |
| CSV-B-011 | fill_answer | [Practice] answer follows the new blank | fill_answer = with |
| CSV-B-011 | mcq_options | [MCQ] the correct option was the shortest by far, the distractors were fragments, and A used an Indian-English form | four full replies of 60-69 characters |
| CSV-B-011 | mcq_why | [MCQ] why-text must match the new options | rewritten for options A-D |
| CSV-B-012 | indian_pron_tip | [Pron] the tip ignored the real trap in this sentence: the v in "very" (rule 27) | v/w tip with a minimal pair; "little" kept short |
| CSV-B-012 | watch_out | [English] the brief frames Indian-English forms as switches, never errors; a watch_out cross (x) marks an error, so it must show a genuine learner mistake ("You are not audible") | now a genuine learner error ("speak loudly", missing "the") |
| CSV-B-012 | if_customer_pushes | [Accuracy] "the sound from your side" blames the caller, against the card's own point; the agent can only report what they hear | reports what the agent hears |
| CSV-B-012 | mcq_options | [MCQ] correct option was the longest; C (hang up) was absurd and A used an Indian-English form | four realistic replies of 60-70 characters |
| CSV-B-012 | mcq_why | [MCQ] why-text must match the new options | rewritten for options A-D |
| CSV-B-012 | self_check | [Pron] self-check must match the new pronunciation tip | checks the v in "very" |
| CSV-B-013 | linking | [Pron] "fix-the" drops the final t, which contradicts the speaker tip | keeps the t |
| CSV-B-013 | alt_1 | [English] the agent says "Great." before hearing the answer | conditional wording |
| CSV-B-013 | if_customer_pushes | [Accuracy] rule 7: no empathy line when the fix has failed | added a specific apology |
| CSV-B-013 | cultural_note | [English] the note did not describe any Indian-English habit, which is what the field is for | names the common "Any other query?" closing and the international alternative |
| CSV-B-013 | fill_blank | [Practice] "anything" is not the only fit ("something"), so the blank was ambiguous | blank is now "else" |
| CSV-B-013 | fill_answer | [Practice] answer follows the new blank | fill_answer = else |
| CSV-B-013 | mcq_options | [MCQ] distractors were short and silly, so the answer was obvious | four realistic options of 59-67 characters |
| CSV-B-013 | mcq_why | [MCQ] why-text must match the new options | rewritten for options A-D |
| CSV-B-014 | watch_out | [English] the brief frames Indian-English forms as switches, never errors; a watch_out cross (x) marks an error, so it must show a genuine learner mistake ("valuable time", "evening ahead") | now the common missing-article error "Have good evening" |
| CSV-B-014 | ask_next | [Dup] identical to whats_next_reply | different closing words |
| CSV-B-014 | fill_blank | [Practice] "evening" is not the only fit ("day", "night"), so the blank was ambiguous | blank is now "Have", the only verb that fits |
| CSV-B-014 | fill_answer | [Practice] answer follows the new blank | fill_answer = Have |
| CSV-B-014 | mcq_options | [MCQ] correct option was the longest and the distractors were fragments | four full closings of 57-63 characters |
| CSV-B-014 | mcq_why | [MCQ] why-text must match the new options | rewritten for options A-D |
| CSV-B-015 | if_customer_pushes | [Accuracy] rule 7: no empathy line for a caller who still cannot hear | added an apology |
| CSV-B-015 | fill_blank | [Practice] "hear" is not the only fit ("understand"), so the blank was ambiguous | blank is now "can", the answer to "Can you hear me?" |
| CSV-B-015 | fill_answer | [Practice] answer follows the new blank | fill_answer = can |
| CSV-B-015 | mcq_options | [MCQ] D ("Why are you shouting?") was absurd, so the answer was easy to spot | four realistic replies of 63-81 characters |
| CSV-B-015 | mcq_why | [MCQ] why-text must match the new options | rewritten for options A-D |

PROGRESS: done through CSV-B-015

| ID | field | problem | fix |
|---|---|---|---|
| CSV-B-016 | if_customer_pushes | [Accuracy] rule 7: the pushback answer had no empathy line for a caller who had already given a number | apology and acknowledgement first |
| CSV-B-016 | fill_blank | [Practice] "number" is not the only fit (reference, details), so the blank was ambiguous | blank is now "tell", which also drills the open question |
| CSV-B-016 | fill_answer | [Practice] answer follows the new blank | fill_answer = tell |
| CSV-B-016 | mcq_question | [MCQ] question must fit options written as agent actions | asks what the agent should do |
| CSV-B-016 | mcq_options | [MCQ] the correct option was clearly the longest and the distractors were fragments | four actions of 54-57 characters; B, C and D each guess at a request not yet made |
| CSV-B-016 | mcq_why | [MCQ] why-text must match the new options | rewritten for options A-D |
| CSV-B-017 | indian_pron_tip | [Pron] telling speakers to avoid a strong final r is wrong for rhotic accents (US, many Indian speakers) | removed the r advice; kept the real stress trap |
| CSV-B-017 | why_it_works | [Accuracy] the Zendesk point comes from its chat etiquette page, not a voice rule | source named correctly |
| CSV-B-017 | source_rule | [Accuracy] same source detail as why_it_works | source named correctly |
| CSV-B-017 | ask_next | [English] "While I do, can I tell you..." is awkward: the agent cannot arrange the call and talk at once | same offer, clear order of events |
| CSV-B-017 | cultural_note | [Accuracy] "in many centres agents are pushed" is an unsupported claim and named no language habit | names an actual phrase and the international expectation |
| CSV-B-017 | fill_blank | [Practice] "arrange" is not the only fit (organise, set up, do), so the blank was ambiguous | blank is now "why", the empathy frame |
| CSV-B-017 | fill_answer | [Practice] answer follows the new blank | fill_answer = why |
| CSV-B-017 | mcq_options | [MCQ] the correct option was far longer than the fragments, a giveaway | four full replies of 80-93 characters |
| CSV-B-017 | mcq_why | [MCQ] why-text must cover the new option B | rewritten for options A-D |
| CSV-B-017 | whats_next_customer | [Dup] repeated the pushback line and its answer almost word for word | a different, realistic worry (repeating the story) |
| CSV-B-017 | whats_next_reply | [Dup] repeated the pushback answer | answers the new worry (warm transfer, rule 4) |
| CSV-B-018 | stress | [Pron] in the phrasal verb "go through" the particle carries the stress, not "didn't" | stress on THROUGH |
| CSV-B-018 | intonation | [Pron] must match the corrected stress | updated |
| CSV-B-018 | watch_out | [English] the brief frames Indian-English forms as switches, never errors; a watch_out cross (x) marks an error, so it must show a genuine learner mistake ("payment is failed") | now genuine verb-form errors |
| CSV-B-018 | mini_conversation | [Accuracy] the agent concluded "you haven't been charged" from the customer's word, which contradicts the card's own when_not_to_use | agent checks first |
| CSV-B-018 | mcq_options | [MCQ] distractors were absurd (C) and unrelated, so the answer was obvious | four plausible worries of 53-61 characters |
| CSV-B-018 | mcq_why | [MCQ] why-text must match the new options; "most people" is an unsupported quantity | rewritten for options A-D |
| CSV-B-019 | indian_pron_tip | [Pron] the tip was about "second", which is not in this sentence or in the model reply | tip now covers the real hearing trap (on / up) and the ng sound |
| CSV-B-019 | mcq_options | [MCQ] the correct option was clearly the longest | four options of 50-57 characters |
| CSV-B-019 | mcq_why | [MCQ] why-text must cover the new options | added C and D |
| CSV-B-019 | whats_next_customer | [Dup] repeated if_customer_pushes ("I can't find it anywhere" / use the email address instead) | a different follow-up that helps the caller find the number |
| CSV-B-019 | whats_next_reply | [Dup] repeated if_customer_pushes | answers the new question |
| CSV-B-020 | hindi_roman | [Hindi] Devanagari has the gender pair चुके/चुकी but the Roman line had only "chuke" | added chuki |
| CSV-B-020 | cultural_note | [Accuracy] "Some Indian scripts ask..." is an unsupported claim about scripts | describes the phrase, not the scripts |
| CSV-B-020 | mini_conversation | [Accuracy] "Yes" to "can you fix my bill?" promises a result the agent cannot yet guarantee | promises the action, not the result |
| CSV-B-020 | mcq_options | [MCQ] the correct option was clearly the longest | four replies of 79-86 characters |
| CSV-B-020 | mcq_why | [MCQ] why-text must match the new options | rewritten for options A-D |
| CSV-B-020 | whats_next_reply | [Accuracy] "Yes" answers "can you sort it out" with a promise the agent cannot yet keep | promises the action, not the result |

PROGRESS: done through CSV-B-020

| ID | field | problem | fix |
|---|---|---|---|
| CSV-B-002 | self_check | [English] self_check named an Indian-English-only form; the brief allows those only in cultural_note, dont_say and positive_swap | checks the polite frame instead |
| CSV-B-005 | self_check | [English] self_check named an Indian-English-only form; the brief allows those only in cultural_note, dont_say and positive_swap | checks the full phrase instead |

PROGRESS: done through CSV-B-020

## Summary

All 20 cards of cards_VB.txt (CSV-B-001 to CSV-B-020) were reviewed against the full checklist and the audit reports no error or warning for this file (only the 160 expected "card missing" lines for other groups remain). 161 field changes were logged, spread over every card, in these types: MCQ options, question and why-text 48 (all 20 MCQs were rebuilt so the options are full, similar-length, realistic lines and the correct option is no longer a giveaway; answer letters were left at 5 each for A, B, C and D, as required), other practice fields 33 (mostly ambiguous fill-in blanks that accepted a second answer, plus follow-up and record tasks), English wording 23 (including watch_out crosses that showed Indian-English forms as errors, now genuine learner mistakes, and self-checks that named such forms), accuracy and honesty 20 (missing empathy line before the action, a verification rule that did not match the line, an agent concluding "you haven't been charged" without checking, an unsupported claim about scripts, Zendesk source scope, the apology study ranking), pronunciation fields 18 (stress and linking that contradicted the speaker tip, a quoted line not in the sentence, and tips that missed the real trap such as the v in "very"), duplicates and consistency 12 (near-identical ask_next and whats_next lines, and follow-ups repeating another card's scenario), and Hindi 7 (ungrammatical Devanagari and Roman lines, a missing gender pair, prompts that did not match their model answers). Nothing was left unresolved. One judgement call for the coordinator: the brief says Indian-English-only forms may appear only in cultural_note, dont_say and positive_swap, so they were removed from watch_out crosses, MCQ distractors and self-checks on this file; other groups may want the same treatment.

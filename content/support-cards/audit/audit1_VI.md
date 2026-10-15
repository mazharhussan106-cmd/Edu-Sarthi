# Audit round 1 — cards_VI.txt (Voice · Intermediate, CSV-I-001 to CSV-I-020)

Reviewer log. One row per real change. Fields changed together (fill_blank + fill_answer) share a row.

| ID | field | problem | fix |
|---|---|---|---|
| CSV-I-001 | hindi_meaning | "मैं सही समझा/समझी हूँ" is not standard Hindi: the perfect of समझना takes "मैंने … समझा है" and has no gender form | "तो अगर मैंने सही समझा है, तो कल रात के अपडेट के बाद से …" |
| CSV-I-001 | hindi_roman | Did not match the corrected Devanagari | "To agar maine sahi samjha hai, to kal raat ke update ke baad se …" |
| CSV-I-001 | grammar_pattern | "statement in past simple" is wrong when the summary uses the present perfect (alt_2 does) | "summary of the problem" |
| CSV-I-001 | watch_out | The ✗ "If I am understanding correctly" is natural English ("If I'm understanding you correctly"), so it taught a false error | ✗ now shows real learner errors: adjective for adverb, "is stopped", missing article |
| CSV-I-001 | fill_blank | "understood" and "heard" both fit | Added the cue "(understand)" so the only answer is "understood" |
| CSV-I-001 | mcq_options | Correct option was the only polished sentence and clearly the longest; D (the "no?" tag) was a defensible check | Four options of 74-87 characters; A, B, D are now clearly not checks (no check, asks to repeat, claims to understand) |
| CSV-I-001 | mcq_why | Matched the old options | Rewritten for the new A, B and D |
| CSV-I-001 | hindi_to_english | Prompt used the non-standard "samjha hoon" | "Agar maine sahi samjha hai, to aapka card …" |
| CSV-I-002 | watch_out | ✗ "but what to do?" is a fatalistic Indian-English idiom shown as a learner error, and not a form mistake a learner can fix | ✗ now has two real learner errors: "specially" for "especially" and "after wait" |
| CSV-I-002 | more_formal | "I will resolve this for you immediately" promises something an agent cannot guarantee | "I will arrange a new appointment for you straight away" |
| CSV-I-002 | fill_blank | Many adjectives fit (upsetting, annoying, difficult) | Cue "(frustrate)": the task is -ing (thing) versus -ed (person), one answer |
| CSV-I-002 | mcq_options | B was the only real sentence and clearly the longest; A, C, D were caricatures ("I understand" three times, "calm yourself") | Four realistic options of 71-75 characters: scripted apology, "I understand, sir", sympathy that sends the customer to a website |
| CSV-I-002 | mcq_why | Matched the old options | Rewritten for the new A, C, D |
| CSV-I-003 | mini_conversation | "I'm sorry about that" is a vague apology (rule 8) | "I'm sorry you've had to explain this twice." |
| CSV-I-003 | fill_blank + fill_answer | "take care / charge / ownership of this" all fit | Blank moved to the preposition: "take care ____ this" → "of" (the watch_out mistake is "take care for") |
| CSV-I-003 | mcq_options | D clearly longest; A to C were obvious weak lines | Four options of 69-73 characters; B and C now hand the case on (billing team / right team) |
| CSV-I-003 | mcq_why | Matched the old options | Rewritten for the new B and C |
| CSV-I-004 | hindi_meaning | Devanagari "भुगतान" but Roman "payment": the two did not match | "आख़िरी पेमेंट", the everyday call-centre word, matching the Roman line |
| CSV-I-004 | watch_out | ✗ used "Firstly … secondly", which is correct English and not an error | ✗ now keeps only the real mistake ("do reset of your account") |
| CSV-I-004 | fill_blank + fill_answer | "first" and "firstly" both fit | Blank moved to "and ____ I'll reset" → "then" (grammar_pattern: first … then) |
| CSV-I-004 | mcq_options | A clearly longest; D used "do the needful" (an Indian-English phrase outside the allowed fields) | Four options of 76-94 characters, no "do the needful" |
| CSV-I-004 | mcq_why | Matched the old options | Rewritten for the new B, C, D |
| CSV-I-004 | whats_next_reply | Invented "only the password will change" (a reset is not a password change) and a flat "No" the agent cannot know | "As far as I can see, no. Your saved settings stay as they are, and I'll tell you before I change anything else." |
| CSV-I-005 | stress | "about" is stressed on the second syllable (a-BOUT), as in the reference card | "i-NEED-a-BOUT-FIVE-more-MIN-utes" |
| CSV-I-005 | indian_pron_tip | "not 'faiw' or 'faiv' with no friction" was confusing and "would" was not drilled | One clear contrast: "five" with teeth on lip (not "faiw"), "would" with rounded lips (not "vould") |
| CSV-I-005 | alt_2 | Spoken line had a semicolon and no thanks on return (rule 1) | Thanks + specific apology, then two plain sentences |
| CSV-I-005 | ask_next | Repeated the whats_next_reply wording almost word for word | Now asks "Is this the best number to reach you on?" and gives the time |
| CSV-I-005 | fill_blank + fill_answer | "shall" and "should" both fit | Blank moved to "Would you like ____ stay" → "to" |
| CSV-I-005 | mcq_options | C clearly longest; A and B (silence, mute) were obvious | Four options of 61-66 characters covering silence, mute, repeated "one more minute" and the correct return |
| CSV-I-005 | mcq_why | Matched the old options | Rewritten for the new A, B, D |
| CSV-I-005 | role_play | "returns after the promised two minutes" breaks rule 2 (check back before the time is up) | "returns just before the promised two minutes are up" |

PROGRESS: done through CSV-I-005

| ID | field | problem | fix |
|---|---|---|---|
| CSV-I-006 | hindi_meaning | "बिलिंग की प्रिया" is clipped; Hindi says "बिलिंग टीम की प्रिया" | "बिलिंग टीम की प्रिया से जोड़ रहा/रही हूँ" |
| CSV-I-006 | hindi_roman | Must match the Devanagari | "billing team ki Priya" |
| CSV-I-006 | watch_out | ✗ "concerned department" is an Indian-English phrase shown as a learner error (rule 24/25: switch, not error) | ✗ now a real form error: "brief to her", "repeat again" |
| CSV-I-006 | alt_2 | "pick up right where we are" is not idiomatic | "carry on from where we are now" |
| CSV-I-006 | mini_conversation | Agent told the caller "You'll be on a short hold" instead of asking (rule 1) | "Is it all right if I put you on a short hold for about a minute while I speak to her?" |
| CSV-I-006 | fill_blank | "brief", "tell", "update", "inform" all fit | Cue added: "(starts with b)" |
| CSV-I-006 | mcq_options | B clearly longest; D used "concerned department" (outside the allowed fields); A and C were caricatures | Four realistic options of 85-96 characters: no-reason hold, "call the billing line yourself", cold transfer that makes the caller repeat |
| CSV-I-006 | mcq_why | Matched the old options | Rewritten for the new A, C, D |
| CSV-I-006 | reorder_task + reorder_answer | Only 4 words (audit ERROR, needs 5+) | "I'll connect you to Priya in billing" (7 words), a fixed word order with no second valid order |
| CSV-I-006 | role_play | Needed a third person (Partner C), but the task must be for two people | Partner B says the briefing aloud, then hands A over by name |
| CSV-I-007 | linking | "REE-fun-dwil" implies the d joins "will", which is not a linking pattern; "within_five" showed no link | "REE-fun-wil" (final d dropped) and "five_to_seven → FYV-tuh-SEV-en" (weak "to") |
| CSV-I-007 | key_chunk | "will reach you" does not match the sentence ("will reach your account") | "Your ___ will reach your account within ___, so by ___ at the latest." |
| CSV-I-007 | watch_out | ✗ ended in "working days only", an Indian-English habit shown as an error | ✗ now real form errors: "reach to", "at latest" |
| CSV-I-007 | ask_next | "next Friday" can mean two different Fridays when spoken | Added "That's Friday the twenty-third." (matches the channel_note date) |
| CSV-I-007 | mini_conversation | Agent said "your reference number" without ever giving one | Agent now says a reference number is being emailed, then "call us with it" |
| CSV-I-007 | mcq_options | C clearly the longest; A, B, D were one-liners | Four options of 67-72 characters; D is now an honest "depends on your bank" |
| CSV-I-007 | mcq_why | Matched the old options | Rewritten ("A and B are guesses") |
| CSV-I-007 | hindi_to_english | Prompt had no "zyaada se zyaada" but the answer says "at the latest" | Prompt now has "ke andar" and "zyaada se zyaada" |
| CSV-I-008 | tone_note | Quoted "as per policy" (an Indian-English phrase) outside the allowed fields | Replaced with "Sorry, we can't cancel it. That's the rule." |
| CSV-I-008 | fill_blank | "can", "will", "could" all fit | Cue "(am able to)" so the only answer is "can" |
| CSV-I-008 | mcq_options | D clearly longest; B used "As per policy"; A and C bare one-liners | Four options of 82-90 characters; A is a polite no with a reason but no alternative |
| CSV-I-008 | mcq_why | Matched the old options | Rewritten for A, B, C |
| CSV-I-008 | hindi_to_english + hindi_to_english_answer | "lekin" prompt does not elicit "so what I can do is"; "already confirmed" gave no reason for the no | Prompt: non-refundable, "isliye main yeh kar sakta hoon ki …"; answer matches |
| CSV-I-008 | whats_next_reply | "the refund starts then" promised something the agent cannot know | "I'll start your refund as soon as it arrives" |
| CSV-I-009 | ask_next | "so it costs less next time" is a promise the agent cannot keep | "travel packs that may be cheaper for your next trip" |
| CSV-I-009 | if_customer_pushes | "I'll check … and see" gave no time and no permission for the wait (rule 1) | Asks "Could you stay on the line for about two minutes …?" |
| CSV-I-009 | mini_conversation | Offered to add a paid pack straight after a charge query | "If you travel again, I can tell you about our travel packs." |
| CSV-I-009 | fill_blank + fill_answer | "roaming", "international" both fit | Blank moved to "charge ____ data" → "for" |
| CSV-I-009 | mcq_options | B clearly the longest; C used "The same has been charged" (IE phrase outside the allowed fields) | Four options of 76-89 characters |
| CSV-I-009 | mcq_why | Matched the old options | Rewritten for A, C, D |
| CSV-I-010 | intonation | Said "which lights" is a wh- question, but it is an indirect question inside an instruction | "because this is an instruction, not a yes/no question" |
| CSV-I-010 | mini_conversation | Agent said an orange Internet light means the line is fine; orange normally signals a fault | Orange now means "no internet connection", so the agent checks the line (hedged with "usually") |
| CSV-I-010 | mcq_question | "grammatically correct and polite" also fitted a plain "unplug it and call back" | Question now asks for the step plus the "what do you see" request |
| CSV-I-010 | mcq_options | D clearly longest; A used "Do one thing" (IE phrase outside the allowed fields) | Four options of 93-100 characters; A differs from D only in embedded word order |
| CSV-I-010 | mcq_why | Matched the old options | Rewritten for A, B, C |

PROGRESS: done through CSV-I-010

| ID | field | problem | fix |
|---|---|---|---|
| CSV-I-001 | tone_note | Quoted the Indian-English tag "…, no?" as a bad agent line outside the allowed fields (found while fixing 011) | Replaced with a neutral example: a flat "So you're saying the internet just died?" can sound like doubt |
| CSV-I-011 | indian_pron_tip | Named three things; "at the rate" is vocabulary, not a sound, and "haitch" is accepted in several varieties so calling it wrong is not safe | One real sound trap: light /t/ in "dot"/"at" (not retroflex), plus the final /lt/ of "spelt" |
| CSV-I-011 | tone_note | Quoted the Indian-English tag "…, no?" outside the allowed fields | "Okay, got it" without a read-back sounds rushed |
| CSV-I-011 | watch_out | ✗ "at the rate" is an Indian-English habit shown as a learner error | ✗ now real form errors: "Let me to read back you", "Is it correct?" |
| CSV-I-011 | more_formal | "confirm … confirm" repeated | "Could you tell me whether that is correct?" |
| CSV-I-011 | mcq_options | Answer was only "at"; C and D ("at sign of", "rate") were nonsense | Four full readings of the address: "at the rate", "at", "at the rate of", "at sign" |
| CSV-I-011 | mcq_why | Matched the old options | Rewritten for A, C, D |
| CSV-I-011 | whats_next_reply | "Is that right now?" can be read as "right now" (time) | "Is that correct now?" |
| CSV-I-012 | fill_blank | "even if" and "even though" both fit | "by then" restored in the blank sentence, which only fits "if" |
| CSV-I-012 | mcq_options | B clearly longest; C used "revert" (outside the allowed fields) | Four options of 71-79 characters, none using "revert" |
| CSV-I-012 | mcq_why | Matched the old options | Rewritten for A, C, D |
| CSV-I-013 | hindi_meaning | Devanagari "पुष्टि का ईमेल" but Roman "confirmation email": mismatch | "कन्फ़र्मेशन ईमेल" |
| CSV-I-013 | fill_blank + fill_answer | "to sum up" and "to wrap up" both fit | Blank moved to "Does that ____ everything out" → "sort" |
| CSV-I-013 | mcq_options | A clearly longest; B to D were one-liners | Four options of 64-75 characters, all full close sequences |
| CSV-I-013 | mcq_why | Matched the old options | Rewritten for B, C, D |
| CSV-I-013 | hindi_to_english | "Toh main batata hoon" does not elicit "to sum up" | "Toh, sankshep mein: …" |
| CSV-I-013 | whats_next_customer + whats_next_reply | Near-copy of if_customer_pushes (same email/spam-folder reply) | New branch: "I still can't log in on my phone" → keep the call open and ask which app (when_not_to_use) |
| CSV-I-014 | sentence | Logic error: it read the number first, then asked if the caller could write it down | New sentence: "I have a reference number for your complaint. Do you have something to write it down with? I'll say it slowly." The number is read in the mini conversation |
| CSV-I-014 | stress | Quoted the old sentence | Rewritten for the new sentence |
| CSV-I-014 | intonation | Described reading the code, which is no longer in the sentence | Fall on "complaint", rise on the pen question, wait; code groups kept as a note |
| CSV-I-014 | indian_pron_tip | "Seven" is no longer in the sentence | "REF-rence" stress, plus /θ/ in "something" |
| CSV-I-014 | hindi_meaning + hindi_roman | Translated the old sentence | New sentence, with "बोलूँगा/बोलूँगी" for "I'll say it" |
| CSV-I-014 | simple_meaning | Quoted the old sentence | "I have a case number for you. Please get something to write with …" |
| CSV-I-014 | key_chunk | Quoted the old sentence | "I have a reference number for ___. Do you have something to write it down with?" |
| CSV-I-014 | watch_out | ✓ part must match the new sentence | ✓ updated |
| CSV-I-014 | more_formal | Also said the number before the pen check | Offers a moment to find something to write with, then "I will read it slowly" |
| CSV-I-014 | ask_next | Read-back request had no number before it | Now reads the code in groups, then asks for a read-back |
| CSV-I-014 | mini_conversation | Quoted the old sentence | New sentence; the number is read in turn 4 |
| CSV-I-014 | fill_blank | "write" and "note" both fit | Cue "(starts with w)" |
| CSV-I-014 | mcq_options | D clearly longest; A to C were weak one-liners | Four options of 71-77 characters |
| CSV-I-014 | mcq_why | Matched the old options | Rewritten for A, B, C |
| CSV-I-014 | hindi_to_english + hindi_to_english_answer | Same flaw: gave the ticket number before the pen check | "I have a ticket number for you. Do you have a pen handy?" |
| CSV-I-014 | role_play | Order of steps wrong (number given before the check) | B checks A can write, then gives the number in groups |
| CSV-I-014 | self_check | Third check was about "seven", which left the sentence | "Did you stress REF-rence on the first syllable?" |
| CSV-I-015 | watch_out | "I'm sorry about that" is a vague apology (rule 8) | "I'm sorry you've been charged twice." (✓ part) |
| CSV-I-015 | positive_swap | Same vague apology | Specific apology |
| CSV-I-015 | ask_next | Same vague apology | Specific apology |
| CSV-I-015 | mini_conversation | Same vague apology | Specific apology |
| CSV-I-015 | fill_blank + fill_answer | "twice", "double", "two times" all fit | Blank moved to the passive: "I've ____ charged" → "been" |
| CSV-I-015 | mcq_options | Distractors C and D ("buy the item again", "a new account") were absurd | Four "They want …" options of 54-60 characters |
| CSV-I-015 | mcq_why | Said the customer is "happy with the order", which the sentence does not say | "nothing in the sentence suggests they dislike the order" |
| CSV-I-015 | hindi_to_english + hindi_to_english_answer | Vague apology | Prompt and answer use the specific apology |
| CSV-I-015 | whats_next_reply | Refund promise had no time (rule 9) | "I'll start the refund for the second one now." |

PROGRESS: done through CSV-I-015

| ID | field | problem | fix |
|---|---|---|---|
| CSV-I-016 | stress | "a-bout" written with no stress; dictionary stress is a-BOUT | "i'm-CALL-ing-a-BOUT-THIS" |
| CSV-I-016 | watch_out | ✗ "from starting" is an Indian-English construction shown as an error | ✗ now a real bad agent line: "Sorry for the inconvenience. Please give me your complaint details." |
| CSV-I-016 | if_customer_pushes | "I'll call you tomorrow to confirm it's done" promises a result the engineer visit cannot give by tomorrow | "… to confirm the visit." |
| CSV-I-016 | fill_blank + fill_answer | "third", "second", "fourth" all fit | Blank moved to "the third ____" → "time" |
| CSV-I-016 | mcq_options | C clearly longest; A, B, D were one-liners | Four options of 77-91 characters, all plausible first replies |
| CSV-I-016 | mcq_why | Matched the old options | Rewritten for A, B, D |
| CSV-I-016 | hindi_to_english | "Uski baat maaniye" (accept his word) is unnatural and the prompt left out "won't need to repeat anything" | "Pehle maafi maangiye … taaki unhe kuch dohrana na pade" |
| CSV-I-016 | whats_next_reply | Vague apology and a callback with no time (rules 8, 9) | "sorry it has taken three calls" and "I'll call you on Wednesday with the delivery date" (matches the mini conversation) |
| CSV-I-017 | watch_out | ✗ "It is getting hanged?" shown as an error, though "hang" is an Indian-English habit (cultural_note) | ✗ now a real form error: "your app is stopped working" |
| CSV-I-017 | cultural_note | Said international customers may not expect "hang" for software; "the app hangs" is standard computing English, and "hanged" is the wrong past form | "hung" is the standard past form; many customers say "freeze", "crash" or "get stuck" |
| CSV-I-017 | mini_conversation | Agent moved to a fix without paraphrasing (the card's own source_rule) | Added "So the app freezes on the first screen every time." |
| CSV-I-017 | fill_blank | "freezing", "crashing", "hanging" all fit | Cue "(freeze)": the task is keep + verb-ing |
| CSV-I-017 | mcq_options | D clearly longest; B ("very cold") was absurd | Four options of 56-67 characters; C is slowness, A is a crash |
| CSV-I-017 | mcq_why | Matched the old options | Added why C is wrong |
| CSV-I-017 | hindi_to_english + hindi_to_english_answer | Vague "I'm sorry about that" | Prompt asks for an apology; answer "I'm sorry the app keeps freezing." |
| CSV-I-017 | whats_next_reply | "older phones sometimes need the latest version" is doubtful and hints at the phone being the cause | "updates often fix freezing" |
| CSV-I-018 | if_customer_pushes | "tell you in a minute" is a hold without permission (rule 1) and the empathy was generic | "you were hoping for sooner. Could you hold for about a minute while I check …?" |
| CSV-I-018 | cultural_note | Sweeping claim that "Indian agents are often trained" to over-explain, with no source | Reworded to "Some agents explain the whole process first …" |
| CSV-I-018 | fill_blank | "just", "please", "kindly" all fit | Cue "(only, simply)" |
| CSV-I-018 | mcq_options | C clearly longest; A, B, D were one-liners | Four options of 65-70 characters |
| CSV-I-018 | mcq_why | Matched the old options | Added why A and B are wrong |
| CSV-I-018 | whats_next_reply | "I'll make sure the courier calls you" is a promise the agent cannot keep | "I'll ask the courier to call you an hour before." |
| CSV-I-019 | watch_out | ✗ "by mistake only" is an Indian-English emphasis shown as an error | ✗ now "You must have done it by mistake." (the real fault is the blame) |
| CSV-I-019 | fill_blank | "signed", "showed", "turned" up all fit | Cue "(sign)" |
| CSV-I-019 | mcq_options | A clearly longest; C ("As per our records") and D were caricatures | Four options of 74-82 characters; none uses "as per" |
| CSV-I-019 | mcq_why | Matched the old options | Rewritten for B, C, D |
| CSV-I-019 | hindi_to_english | Prompt left out "stop it if it shouldn't be there", which the answer contains | Prompt now includes it |
| CSV-I-019 | whats_next_reply | Invented "after 30 days" | "when it ended" |
| CSV-I-020 | watch_out | ✓ committed to emailing without asking, unlike positive_swap and the MCQ | "Shall I email you the details so you can compare?" |
| CSV-I-020 | alt_2 | Semicolon in a spoken customer line | Full stop |
| CSV-I-020 | mcq_options | C used "revert" (outside the allowed fields); B, C, D were one-liners | Four options of 62-76 characters; B, C, D are urgency, pressure and probing |
| CSV-I-020 | mcq_why | Matched the old options | Added C and D |
| CSV-I-020 | whats_next_reply | "we won't call you" is a promise about other teams the agent cannot keep | "I'll note on your account that you don't want a call about it." |

PROGRESS: done through CSV-I-020

| ID | field | problem | fix |
|---|---|---|---|
| CSV-I-011 | self_check | "not 'at the rate'" frames an Indian-English habit as an error (rule 25) | "Did you say 'at' for the @ sign?" |
| CSV-I-012 | self_check | "Did you avoid 'revert'?" frames it as an error | "Did you say 'call you back' or 'get back to you'?" |

PROGRESS: done through CSV-I-020

## Summary

All 20 cards (CSV-I-001 to CSV-I-020) were read against the checklist. 158 field edits were made across all 20 cards and are logged in 144 rows above (combined rows cover a blank and its answer, or a reorder task and its answer). By type, approximately:

- **MCQ (41 edits, every card):** options and explanation rewritten on all 20 cards so that the correct option is no longer a giveaway. The audit now finds no card where the correct option is clearly the longest, down from 17 of 20. Distractors are realistic rather than caricatures, no distractor uses an Indian-English phrase outside the allowed fields, and a few questions were tightened so there is exactly one defensible answer (010, 013).
- **Fill-in-the-blank (about 24 edits):** 16 blanks had more than one defensible answer (for example "understood" or "heard", "even if" or "even though"). They now carry a cue, test a fixed word, or sit on a different word.
- **Hindi (21 edits):** non-standard or unnatural Devanagari corrected (001), Roman text brought in line with the Devanagari (004, 006, 013), and Hindi-to-English prompts changed so they elicit the card's target frame (007, 008, 013, 014, 015, 016, 017, 019).
- **Pronunciation (9 edits):** respelling and stress corrected (005, 007, 016), tips reduced to one real sound trap (005, 011, 014), and an inaccurate intonation explanation fixed (010).
- **Accuracy, honesty and service rules (about 45 edits across watch_out, whats_next_reply, if_customer_pushes, mini_conversation, ask_next, more_formal, role_play):**
  - promises an agent cannot keep were removed (002, 008, 009, 018, 020);
  - times were added to promises (015, 016);
  - permission and a real time were added for holds (006, 009, 018);
  - vague apologies were made specific (003, 015, 016, 017);
  - an invented fact was removed (004, 019);
  - an orange-light claim was corrected (010).
- **Indian-English phrases framed as errors, or used outside the allowed fields (about 14 edits):** these appeared in watch_out, tone_note, self_check and quoted lines (001, 006, 007, 008, 011, 012, 016, 017, 019). They now appear only as switches in cultural_note, dont_say or positive_swap, and 011 keeps "at the rate" in its MCQ because that switch is the whole point of the card.
- **Structural fixes:** CSV-I-006 reorder had 4 words (audit ERROR), now 7. CSV-I-006 role-play needed three people, now two. CSV-I-014 had a logic error (the sentence read the number before checking the caller could write it), so the sentence and every field quoting it were rewritten.

Final audit: no ERROR or warning mentions cards_VI.txt or any CSV-I ID (only the 160 "card missing" lines for other groups remain). Nothing is left unresolved. Two judgment calls for the coordinator: (1) CSV-I-007 keeps "by next Friday" in the sentence (it can mean two different Fridays when spoken), but ask_next now adds "That's Friday the twenty-third" and the channel note asks for an exact date in writing; (2) the Hindi gender slash forms were kept on the speaker's own verbs, while the `hindi_to_english` prompts stay masculine-only, as in the reference card.

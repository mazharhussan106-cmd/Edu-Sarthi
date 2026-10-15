# Audit round 1 — cards_CI.txt (Chat · Intermediate, CSC-I-001 to CSC-I-020)

Reviewer log. Tags in the "problem" column: [accuracy] service rule, honesty, security or scenario logic · [english] wording · [hindi] · [pron] stress, linking, tip · [mcq] options or answer logic · [practice] fill/reorder/translate/role-play · [consistency] field no longer matches another field.

| ID | field | problem | fix |
|---|---|---|---|
| CSC-I-001 | stress | [pron] "a-bout" printed without its stress, and the order number is missing from the line | "a-BOUT"; added "four-eight-two-one-THREE" and "and" so the line covers the whole sentence |
| CSC-I-001 | linking | [pron] "I'm_Rohan" is not a link (m and r do not join) | replaced with a real weak-form link, I_can_see → "ai-kn-SEE" |
| CSC-I-001 | ask_next | [accuracy] "delivery pin code" can be read as a security PIN and no purpose was given | now a yes/no check of the address already saved; no data requested |
| CSC-I-001 | whats_next_reply | [accuracy] "in a moment" is a vague promise (rules.md 9) | "I'll tell you where it is within two minutes" |
| CSC-I-001 | mcq_options | [mcq] correct option B was far the longest; distractors were short curt lines | four similar-length, realistic openings (A, C, D each fail in a different way); B kept as the answer |
| CSC-I-001 | mcq_why | [consistency] explanation referred to the old options | rewritten for the new A, C and D |
| CSC-I-001 | hindi_to_english | [practice] English answer contained "and I'll check it now" that the Hindi prompt did not say | added "aur main abhi ise check karti hoon" to the prompt |
| CSC-I-002 | sentence | [accuracy] scenario contradicted itself: a customer who cannot log in was told to open Settings > Security inside the app | login-screen steps: 1. Tap Log in. 2. Tap Forgot password. 3. Type your email address. |
| CSC-I-002 | recall_cue | [consistency] "three taps", but step 3 is typing | "three short steps" |
| CSC-I-002 | stress | [consistency] stress line followed the old steps | rebuilt for the new sentence (log-IN, for-GOT, ad-DRESS) |
| CSC-I-002 | linking | [pron] "reach_step" is not a link | log_in → "lo-gin", email_address → "ee-may-la-DRESS" |
| CSC-I-002 | indian_pron_tip | [pron] tip was about "Settings" and "security", no longer in the sentence | v/w tip on "password" with minimal pair west / vest |
| CSC-I-002 | hindi_meaning | [hindi] still the old steps; opening not natural | new steps; "तरीका यह है"; "जब आप स्टेप 3 पर पहुँच जाएँ, तो मुझे बता दीजिए" |
| CSC-I-002 | hindi_roman | [hindi] must match the Devanagari | rewritten to match (email pata, pahunch jaayein) |
| CSC-I-002 | tone_note | [consistency] quoted "go to settings" | "go to the login screen" |
| CSC-I-002 | watch_out | [consistency] old steps | ✗/✓ rebuilt for login steps |
| CSC-I-002 | positive_swap | [consistency] old steps | rebuilt |
| CSC-I-002 | alt_1 | [consistency] old steps | login-screen version |
| CSC-I-002 | alt_2 | [consistency] old steps | login-screen version |
| CSC-I-002 | more_formal | [consistency] old steps | login-screen version |
| CSC-I-002 | ask_next | [consistency] referred to a screen that no longer exists | asks about the "Send reset link" button under the email box |
| CSC-I-002 | replies_you_may_hear | [consistency] "can't find Security", "which settings" | "can't see Forgot password", app or website |
| CSC-I-002 | mini_conversation | [accuracy] old steps; "arrives within a minute" is a promise the agent cannot keep | new steps; "usually arrives within a minute" |
| CSC-I-002 | fill_blank + fill_answer | [practice] "reach" was not the only fit (finish, start, complete also work) | blank is now "Here's ____ to reset…", answer "how" |
| CSC-I-002 | mcq_options | [mcq] the numbered option was the longest and the only one with numbers | four similar-length options; one distractor is numbered but packs four actions into step 1; C kept as the answer |
| CSC-I-002 | mcq_why | [consistency] explanation referred to the old options | rewritten for the new A, B and D |
| CSC-I-002 | whats_next_customer | [consistency] old menu item | "I can't find Forgot password anywhere." |
| CSC-I-002 | whats_next_reply | [consistency] invented "below Notifications" | where Forgot password sits on the login screen |
| CSC-I-003 | situation | [consistency] "started a refund" while the line says "I've processed" | "processed a refund" |
| CSC-I-003 | recall_cue | [consistency] asked for "two facts" but the memory hook and self-check use three | "three facts" |
| CSC-I-003 | stress | [pron] amount "₹1,499" missing from the stress line; "method" had no stress | added the amount read aloud; "METH-od" |
| CSC-I-003 | linking | [pron] "I've_processed" and "within_five" are not links | refund_of → "REE-fun-duv", hundred_and → "hun-dred-n", reach_your → "ree-chyer" |
| CSC-I-003 | watch_out | [consistency] ✓ part said "your card" while the sentence says "original payment method" | ✓ now matches the sentence exactly |
| CSC-I-003 | alt_2 | [accuracy] "You'll see it on your original card" is firmer than the bank allows and assumes a card | "You should see it on the card or account you paid with" |
| CSC-I-003 | if_customer_pushes | [accuracy] bare "I understand" (rules.md 7) | names the feeling ("I can see why that feels unfair"), then the facts |
| CSC-I-003 | fill_blank + fill_answer | [practice] "in" is as correct as "within" | blank is "working ____", answer "days" |
| CSC-I-003 | mcq_options | [mcq] correct option about three times longer than the others | four similar-length options; B kept as the answer |
| CSC-I-003 | mcq_why | [consistency] explanation referred to the old options | rewritten |
| CSC-I-003 | hindi_to_english | [practice] "aa jaayega" (will arrive) did not match "should reach" | "aapke account mein aa jaana chahiye" |
| CSC-I-003 | hindi_to_english_answer | [english] "reach you" (the money reaches the account) | "reach your account" |
| CSC-I-004 | cultural_note | [accuracy] claimed "due to + clause" is common in Indian English without a source | reworded as a common learner habit, added a correct "due to + noun" example |
| CSC-I-004 | if_customer_pushes | [accuracy] "You're right, the delay wasn't your fault" confirms a fact the agent has not checked | empathy, then how the timer works, then the next action |
| CSC-I-004 | whats_next_reply | [consistency] identical to the last line of mini_conversation | different reply with a next step if the hold stays |
| CSC-I-004 | fill_blank + fill_answer | [practice] "because", "since" and "as" all fit | blank is "That's ____ the order wasn't placed", answer "why" |
| CSC-I-004 | mcq_question | [mcq] options C and D both explain without blame, so two answers were defensible | question now asks for the real reason in correct English without blame |
| CSC-I-004 | mcq_options | [mcq] correct option about twice as long as the others | four similar-length options; C kept as the answer |
| CSC-I-004 | mcq_why | [consistency] explanation did not cover D | rewritten for all four options |
| CSC-I-005 | situation | [english] "they cannot answer it" was ambiguous | "you cannot answer it" |
| CSC-I-005 | stress | [pron] "p-m" shows no stress | "pee-EM" |
| CSC-I-005 | if_customer_pushes | [accuracy] "reply here" may not work after the chat closes | "message us with it" |
| CSC-I-005 | mini_conversation | [accuracy] no empathy before action (rules.md 7); odd placeholder "@example.com" | "I'm sorry to hear you were charged twice."; asks the customer to check the saved address |
| CSC-I-005 | fill_blank + fill_answer | [practice] "by", "before" and "around" all fit | blank is "don't need ____ stay", answer "to" |
| CSC-I-005 | mcq_options | [mcq] correct option about twice as long as the others | four similar-length options; C kept as the answer |
| CSC-I-005 | mcq_why | [consistency] explanation referred to the old options | rewritten |
| CSC-I-005 | whats_next_reply | [english] "billing changes need their team's access" is stiff | "only our billing team can change a charge" |

PROGRESS: done through CSC-I-005

### Batch 2 (CSC-I-006 to CSC-I-010)

| ID | field | problem | fix |
|---|---|---|---|
| CSC-I-006 | stress | [pron] line left out "Vikram" and "for you now" | complete line, "VIK-ram" and "for you NOW" added |
| CSC-I-006 | linking | [pron] "see_why" is not a link and "arrived_damaged" hid the real joined "d" | arrived_damaged → "a-RAIVD-DAM-ijd" (one joined "d"), arrange_a → "a-RAIN-ja" |
| CSC-I-006 | alt_1 | [english] "That's not what you should receive" is unnatural | "That's not how it should have arrived" |
| CSC-I-006 | more_formal | [english] "accept my apologies that…" is not idiomatic | "I sincerely apologise that your order arrived damaged." |
| CSC-I-006 | fill_blank + fill_answer | [practice] "broken", "cracked" fit as well as "damaged" | blank is "I can see ____ that's upsetting", answer "why" |
| CSC-I-006 | mcq_options | [mcq] correct option far longer than the curt distractors | four similar-length replies, each wrong in a different way; B kept |
| CSC-I-006 | mcq_why | [consistency] explained only A | rewritten for A, C and D |
| CSC-I-006 | hindi_to_english | [practice] "really" missing in the Hindi; speaker gender fixed to male | "bahut afsos", "bhejta/bhejti" |
| CSC-I-007 | stress | [pron] verb "update" stressed on the noun syllable (UP-date); "Meera" missing | "up-DATE"; "MEE-ra" added |
| CSC-I-007 | linking | [pron] "still_checking" is not a link; update_you lost its stress | than_I → "tha-nai"; "up-DAY-choo" |
| CSC-I-007 | if_customer_pushes | [accuracy] "I know, and I'm sorry" is not specific; offer had no time (rules.md 8, 9) | "I'm sorry you've waited so long" and "I'll email you the answer within 15 minutes" |
| CSC-I-007 | mini_conversation | [consistency] last agent line repeated ask_next | "Good news, Meera: the blue one is in stock…" |
| CSC-I-007 | mcq_options | [mcq] mixed formats (one option was "Nothing…"); B clearly longest | four chat messages of similar length; B kept |
| CSC-I-007 | mcq_why | [consistency] covered only C | rewritten for A, C and D |
| CSC-I-007 | hindi_to_english | [hindi] "mein" does not give "within"; gender missing | "ke andar", "raha/rahi", "doonga/doongi" |
| CSC-I-007 | whats_next_reply | [accuracy] "I'll email it to you" had no time (rules.md 9) | "within the hour" |
| CSC-I-008 | sentence | [accuracy] saying no needs reason + empathy + alternative; empathy was missing | added "I'm sorry," at the start |
| CSC-I-008 | stress | [consistency] new opening; "send it to…" missing | rebuilt |
| CSC-I-008 | linking | [pron] "locked_once" and "pickup_point" are not links | send_it, arrange_a, an_order |
| CSC-I-008 | hindi_meaning | [hindi] no apology word | "माफ़ कीजिए," added |
| CSC-I-008 | hindi_roman | [hindi] must match | "Maaf kijiye," added |
| CSC-I-008 | simple_meaning | [consistency] no apology | "Sorry, we cannot…" |
| CSC-I-008 | why_it_works | [consistency] did not mention the apology | added |
| CSC-I-008 | key_chunk | [consistency] frame lacked the apology | "I'm sorry, ___ once ___, but I can ___ or ___." |
| CSC-I-008 | tone_note | [consistency] said "Leading with options" but the line starts with the reason | "Giving options straight after the reason…" |
| CSC-I-008 | watch_out | [consistency] ✓ part did not match the sentence | ✓ now starts "I'm sorry," |
| CSC-I-008 | alt_2 | [english] "What I can do is a free return" is ungrammatical | "What I can do is arrange a free return or redirect it…" |
| CSC-I-008 | ask_next | [accuracy] "pin code" can be read as a security PIN | asks for the area; "A postal code is fine." |
| CSC-I-008 | if_customer_pushes | [accuracy] bare "I understand" (rules.md 7) | "I understand you want it to reach your new address." |
| CSC-I-008 | mini_conversation | [consistency] sentence changed; "pin code" | updated; "postal code" |
| CSC-I-008 | fill_blank | [consistency] sentence changed | updated, answer "but" unchanged |
| CSC-I-008 | mcq_options | [mcq] correct option about 1.5 times longer than the others; blunt distractors | four similar-length replies; B kept |
| CSC-I-008 | mcq_why | [consistency] covered only A | rewritten for A, C and D |
| CSC-I-008 | reorder_task + reorder_answer | [practice] only 4 words (audit ERROR) | "The address is locked once an order ships" (8 words) |
| CSC-I-008 | hindi_to_english + answer | [practice] pattern now includes the apology; gender missing | "Maaf kijiye…sakta/sakti hoon" / "I'm sorry, the size is locked…" |
| CSC-I-008 | whats_next_customer + whats_next_reply | [consistency] repeated if_customer_pushes (courier change) almost word for word | new exchange: "Is the free return really free?" |
| CSC-I-008 | self_check | [consistency] "lead with what you can do" did not match the sentence | three checks rewritten (sorry + reason, move to what you can do, choice) |
| CSC-I-009 | linking | [pron] "logging_in → log-gin-in" is not a link | if_it → "i-fit" |
| CSC-I-009 | ask_next | [consistency] near-copy of the last mini_conversation line; rule 15 wants a summary | adds "To sum up, your account is unlocked and working again." |
| CSC-I-009 | fill_blank + fill_answer | [practice] "if" and "whether" both fit | blank is "Could you ____ logging in again…", answer "try" |
| CSC-I-009 | mcq_options | [mcq] correct option clearly the longest; distractors were fragments | four similar-length messages; A kept |
| CSC-I-009 | mcq_why | [consistency] covered only B | rewritten |
| CSC-I-009 | hindi_to_english | [practice] "until it goes through" not in the Hindi; "now" missing | "abhi…Jab tak payment ho nahin jaata…" |
| CSC-I-010 | stress | [pron] "a-bout" unstressed | "a-BOUT" |
| CSC-I-010 | hindi_meaning | [hindi] "आपके न मिले रिफ़ंड" is stilted | "उस रिफ़ंड से…जो आपको अभी तक नहीं मिला" |
| CSC-I-010 | hindi_roman | [hindi] must match | updated |
| CSC-I-010 | why_it_works | [accuracy] claimed starting with money "shows you understand what matters most" | honest: a sensible default the customer can change |
| CSC-I-010 | mini_conversation | [consistency] last agent line identical to ask_next | rephrased |
| CSC-I-010 | mcq_options | [mcq] correct option the longest by far; B a bare fragment | four similar-length replies; D kept |
| CSC-I-010 | mcq_why | [consistency] covered only B | rewritten |
| CSC-I-010 | hindi_to_english | [practice] "sawaal" (questions) vs English "things" | "baatein poochi hain…pehle delivery se shuru karte hain" |

PROGRESS: done through CSC-I-010

### Batch 3 (CSC-I-011 to CSC-I-015)

| ID | field | problem | fix |
|---|---|---|---|
| CSC-I-011 | linking | [pron] "still_there" and "hear_back" are not links | if_I → "i-fai", message_us → "MES-i-jus", again_anytime → "a-GEN-ee-time" |
| CSC-I-011 | hindi_meaning | [hindi] "क्या आप अभी भी हैं?" is incomplete Hindi for "Are you still there?" | "क्या आप अभी भी यहाँ हैं?" |
| CSC-I-011 | hindi_roman | [hindi] must match | "kya aap abhi bhi yahan hain?" |
| CSC-I-011 | fill_blank + fill_answer | [practice] "close" and "end" both fit | blank is "If I don't ____ back", answer "hear" |
| CSC-I-011 | mcq_options | [mcq] correct option the longest; distractors were fragments ("Hello??", "Nothing") | four similar-length chat messages; A kept |
| CSC-I-011 | mcq_why | [consistency] covered only C | rewritten for B, C and D |
| CSC-I-011 | hindi_to_english | [hindi] "yahan" missing; speaker gender missing | "yahan", "doonga/doongi" |
| CSC-I-011 | whats_next_reply | [consistency] repeated the last mini_conversation line almost word for word | new reply that picks the exchange up again |
| CSC-I-012 | fill_blank + fill_answer | [practice] "appreciate" fits as well as "value" | blank is "if you ____ a moment", answer "have" |
| CSC-I-012 | mcq_options | [mcq] correct option the longest; distractors were fragments ("Rate us now.") | four similar-length messages, three of them pressure the customer; C kept |
| CSC-I-012 | mcq_why | [consistency] covered only A | rewritten for A, B and D |
| CSC-I-012 | whats_next_reply | [consistency] "Have a lovely evening" repeated the mini_conversation | different goodbye |
| CSC-I-013 | linking | [pron] "case_number" is not a link | contact_us → "CON-tak-tus" |
| CSC-I-013 | ask_next | [accuracy] "I'll also send it" gave no time (rules.md 9) | "I'll also email it to you now" |
| CSC-I-013 | mcq_options | [mcq] correct option about twice as long as the others | four similar-length options (two give the number, two read like form letters); C kept |
| CSC-I-013 | mcq_why | [consistency] covered only A | rewritten for A, B and D |
| CSC-I-013 | hindi_to_english | [practice] English answer had "we'll pick up from there", which the Hindi did not say | added "hum wahin se aage badhenge" |
| CSC-I-013 | whats_next_customer + whats_next_reply | [consistency] repeated the mini_conversation (email the number) | new question: where to type the number |
| CSC-I-014 | sentence | [accuracy] "you won't see it again" is a promise the agent cannot keep: a later order can carry another delivery charge | "so it won't be charged again next month" |
| CSC-I-014 | stress | [pron] amount "ninety-nine" had no unit; ending changed | rebuilt with "ru-PEES" and the new ending |
| CSC-I-014 | linking | [pron] "see_it_again" no longer in the sentence | charged_again → "charj-da-gen" |
| CSC-I-014 | hindi_meaning | [hindi] last clause changed | "इसलिए यह अगले महीने दोबारा नहीं लगेगा।" |
| CSC-I-014 | hindi_roman | [hindi] must match | updated |
| CSC-I-014 | grammar_pattern | [consistency] "so + you won't + verb" | "so + it won't + be + past participle" |
| CSC-I-014 | alt_1 | [consistency] ended the same way as the new sentence | "so it won't repeat next month" |
| CSC-I-014 | alt_2 | [accuracy] "Good question" to an angry customer; "nothing more to pay" overpromises | "Thanks for checking… nothing to cancel" |
| CSC-I-014 | more_formal | [consistency] ending | "…again next month" |
| CSC-I-014 | if_customer_pushes | [accuracy] "I'll send" gave no time (rules.md 9) | "I'll send you the invoice breakdown now" |
| CSC-I-014 | mini_conversation | [consistency] quoted the old ending; "I'll email" had no time | updated, "now" added |
| CSC-I-014 | mcq_options | [mcq] correct option the longest; distractors were fragments | four similar-length replies; A kept |
| CSC-I-014 | mcq_why | [consistency] covered only B | rewritten for B, C and D |
| CSC-I-014 | hindi_to_english | [practice] "Shayad" is weaker than "I think" | "Mujhe lagta hai" |
| CSC-I-014 | whats_next_customer + whats_next_reply | [consistency] triple repeat of the "plan" question (pushback, replies, next) | new question about the next order, answered without an invented policy |
| CSC-I-015 | alt_2 | [consistency] "when you tap Pay" does not fit the card's app-cache scenario | "when you try it again" |
| CSC-I-015 | more_formal | [english] "the issue is still continuing" is unnatural | "I apologise that the issue has not been resolved…" |
| CSC-I-015 | ask_next | [consistency] identical to the mini_conversation reply | different wording, same job |
| CSC-I-015 | if_customer_pushes | [consistency] repeated whats_next_reply (technical team, 5 pm) | new step offered first, hand-off within 10 minutes |
| CSC-I-015 | mcq_options | [mcq] correct option about twice as long as the others | four similar-length readings of "still not working"; A kept |
| CSC-I-015 | mcq_why | [consistency] covered only C | rewritten to cover B and D |
| CSC-I-015 | hindi_to_english | [hindi] "Maaf kijiye ki…" is not a natural apology here | "Mujhe afsos hai ki…" |
| CSC-I-015 | whats_next_reply | [accuracy] "That error is on our side" admits fault before the agent has seen the error | "Since the same error keeps coming back…" |

PROGRESS: done through CSC-I-015

### Batch 4 (CSC-I-016 to CSC-I-020)

| ID | field | problem | fix |
|---|---|---|---|
| CSC-I-016 | mini_conversation | [consistency] agent line identical to ask_next and watch_out | "The courier hasn't replied yet, so I'll update you within 2 minutes." |
| CSC-I-016 | if_customer_pushes | [consistency] customer and agent lines were word for word the same as whats_next; offer had no time (rules.md 9) | specific apology, "I'll email you the answer within 30 minutes" |
| CSC-I-016 | whats_next_customer + whats_next_reply | [consistency] exact repeat of if_customer_pushes | new exchange: "just tell me when it will arrive", answered honestly with a time |
| CSC-I-016 | fill_blank + fill_answer | [practice] "wait" and "delay" both fit | blank is "I'm ____ for the wait", answer "sorry" |
| CSC-I-016 | mcq_options | [mcq] correct option about twice as long as the others | four similar-length options; D kept |
| CSC-I-016 | mcq_why | [consistency] covered only A | now covers B and C |
| CSC-I-016 | hindi_to_english | [hindi] "Der ke liye maaf kijiye" asks pardon instead of apologising; "mein" for "within"; gender missing | "mujhe afsos hai", "ke andar", "raha/rahi", "doonga/doongi" |
| CSC-I-017 | mini_conversation | [consistency] agent line identical to ask_next, MCQ D and positive_swap | "I'm sorry you're having trouble. Could you tell me which page you're on and what you see?" |
| CSC-I-017 | if_customer_pushes | [accuracy] no empathy before action (rules.md 7) | "I'm sorry this is getting in your way, and I want to fix it quickly." |
| CSC-I-017 | fill_blank + fill_answer | [practice] "page", "screen" and "device" all fit | blank is "which page ____ on?", answer "you're" (statement word order) |
| CSC-I-017 | mcq_options | [mcq] correct option about twice as long as the others; distractors were fragments | four similar-length replies; D kept |
| CSC-I-017 | mcq_why | [consistency] covered only B | now covers A, B and C |
| CSC-I-017 | hindi_to_english | [hindi] "Maaf kijiye ki…" and "for you" missing | "Mujhe afsos hai ki aapke liye website kaam nahin kar rahi." |
| CSC-I-017 | whats_next_customer + whats_next_reply | [consistency] repeated the last two mini_conversation lines | new exchange: "i cant login at all" |
| CSC-I-018 | stress | [pron] "PROM-ised" contradicted the tip ("PROM-ist") | "PROM-ist" |
| CSC-I-018 | more_formal | [english] "accept my apologies that…" is not idiomatic | "I apologise that you did not receive…" |
| CSC-I-018 | mini_conversation | [consistency] agent line identical to ask_next | different wording, same job |
| CSC-I-018 | mcq_options | [mcq] correct option the longest; distractors were fragments | four similar-length readings; D kept |
| CSC-I-018 | mcq_why | [consistency] covered only B | now covers A and C |
| CSC-I-018 | reorder_task + reorder_answer | [practice] only 4 words (audit ERROR) | "I'm sorry you didn't get the callback" (7 words) |
| CSC-I-018 | hindi_to_english | [hindi] "Maaf kijiye ki…" is not a natural apology; gender missing | "Mujhe afsos hai ki…", "karta/karti" |
| CSC-I-018 | whats_next_customer + whats_next_reply | [consistency] exact repeat of if_customer_pushes | new exchange: "can't you just solve it here in the chat?" (matches when_not_to_use) |
| CSC-I-019 | mini_conversation | [consistency] agent line identical to ask_next | "I'm setting up the exchange now, and the old one will be collected tomorrow." |
| CSC-I-019 | if_customer_pushes | [accuracy] "Fair point" is not a specific apology (rules.md 8) | "You're right, and I'm sorry. I should have led with the answer." |
| CSC-I-019 | when_not_to_use | [accuracy] the model line led with "I can't" (rules.md 11) | "I can offer a refund instead, because this item can't be exchanged" |
| CSC-I-019 | fill_blank + fill_answer | [practice] "Yes, I will" fits as well as "Yes, I can" | blank is "set ____ the exchange", answer "up" |
| CSC-I-019 | hindi_to_english | [hindi] "ho jaayega" (it will be done) is not "I can"; gender missing | "Haan, main kar sakta/sakti hoon… karta/karti hoon" |
| CSC-I-019 | whats_next_customer + whats_next_reply | [consistency] repeated the last mini_conversation turn (time, text message) | new exchange about packing the old item |
| CSC-I-019 | self_check | [consistency] "under two sentences" but the model reply has two | "two short sentences at most" |
| CSC-I-020 | indian_pron_tip | [pron] "NEW-er" does not show the v/w trap | "NEV-er", not "NEH-wer" |
| CSC-I-020 | mini_conversation | [consistency] agent line identical to ask_next | shorter wording, same job |
| CSC-I-020 | if_customer_pushes | [accuracy] "just reply here" may not work after the chat closes | "just message us again" |
| CSC-I-020 | fill_blank + fill_answer | [practice] "helping", "working", "looking" all fit | blank is "sorted, ____ would you like me…", answer "or" (the choice) |
| CSC-I-020 | mcq_options | [mcq] correct option about three times longer than the others | four similar-length replies; A kept |
| CSC-I-020 | mcq_why | [consistency] covered only B | now covers C and D |
| CSC-I-020 | hindi_to_english | [hindi] "bata dijiye" (please tell me) did not match the question in English | "kya aapki problem solve ho gayi hai, ya main aur madad karoon?" |
| CSC-I-020 | whats_next_reply | [accuracy] "message us here" may not work after the chat ends | "message us again" |
| CSC-I-017 | whats_next_customer | [practice] after the fix the line had only 2 words (audit ERROR, min 3) | "i cant login at all" |

PROGRESS: done through CSC-I-020

### Final pass

| ID | field | problem | fix |
|---|---|---|---|
| CSC-I-018 | mcq_options | [mcq] correct option D was the shortest (53 characters against 58–62), a tell in the other direction | D lengthened to "A promise to call them back was broken, and they feel let down."; answer letter unchanged |

## Summary

All 20 cards (CSC-I-001 to CSC-I-020) were read against the checklist and the audit now reports no ERROR for this file or its IDs (only the 160 "card missing" lines for other groups remain). 206 fields were rewritten across 186 logged changes. By type: 70 consistency fixes (a changed sentence or option leaving another field out of date, near-duplicate lines inside a card, mismatched mcq_why); 26 accuracy and service-rule fixes (vague times without a number, bare "I understand", "pin code" read as a security PIN, "you won't see it again" and "message us here" promises the agent cannot keep, one scenario that contradicted itself in CSC-I-002, missing empathy before the refusal in CSC-I-008); 23 practice fixes (ambiguous fill-blanks, two reorder tasks under 5 words, translations that did not match the Hindi prompt); 20 pronunciation fixes (wrong verb stress on "update", pairs that were not links, tips for sounds no longer in the sentence); 21 MCQ fixes (the correct option was clearly the longest in 18 of 20 cards, now at most 5 characters longer than the next option in every card, with distractors made fuller and plausible); 18 Hindi fixes (unnatural phrasing, missing speaker-gender forms, "Maaf kijiye ki…" used as an apology); 8 English fixes ("accept my apologies that…", "the issue is still continuing"). Nothing was left unresolved. Judgement calls for the coordinator: (1) the fill-blank in CSC-I-018 ("promised") still has "expecting" as a weaker second fit; (2) CSC-I-002 was moved from "Settings > Security" to login-screen steps because a locked-out customer cannot reach Settings; (3) CSC-I-008 now opens with "I'm sorry," so the refusal has reason, empathy and alternative.

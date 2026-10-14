# Audit round 1 — cards_EA.txt (Email · Advanced, CSE-A-001…020)

Reviewer log. One row per real change.

| ID | field | problem | fix |
|---|---|---|---|
| CSE-A-001 | stress | Stress map skipped half the sentence (replacement laptop, booked, collect). | Full-sentence stress map; Ms read as 'Miz'. |
| CSE-A-001 | linking | 'complaint_so' is not a real link and teaches dropping the final t, against the clear-final-consonants rule. | Replaced with a true consonant-to-vowel link, collect_it. |
| CSE-A-001 | hindi_meaning | Unnatural Hindi: 'साफ़ तरह से'; 'बदला हुआ लैपटॉप' means a laptop that changed, not a replacement. | 'स्पष्ट ढंग से', 'रिप्लेसमेंट लैपटॉप', 'ले जाने के लिए'. |
| CSE-A-001 | hindi_roman | Roman did not match the Devanagari (Ms Rao, Thursday kept in English; wording changed above). | Roman rewritten as the transliteration of the new Devanagari. |
| CSE-A-001 | alt_2 | Promised a new unit 'as soon as it reaches us' (no time; the customer may want a refund, see if_customer_pushes). | 'I will' plus a day (Friday) and a neutral next step. |
| CSE-A-001 | if_customer_pushes | A bare 'I understand' is a weak empathy line. | Names the cause of the feeling (two faulty laptops), then acts with a day. |
| CSE-A-001 | mini_conversation | Customer opened with one short line, so thanking them for 'setting out' the complaint 'so clearly' contradicted the card's own when_not_to_use; the agent also promised to check the unit 'myself' with no time. | Formal, detailed customer complaint; agent promises an inspection request and a tracking number by Friday. |
| CSE-A-001 | fill_blank | Blank had several valid answers (booked, arranged, ordered, sent). | Base verb in brackets, so only 'booked' fits. |
| CSE-A-001 | mcq_options | Correct option was the longest and the only specific one (giveaway); distractors were one-liners. | Four formal options of similar length; only C names the fault and an action already taken. |
| CSE-A-001 | mcq_why | Explanation must match the new option B. | Reworded to match the new options. |
| CSE-A-002 | sentence | Order was empathy, reason, alternative; rules.md 23 and the card's own source_rule say reason, then empathy, then alternative. A free repair was also offered without knowing of any fault, which clashed with when_not_to_use. | Reason first, then empathy, then 'but I can offer'; the free repair is now conditional on a fault. |
| CSE-A-002 | stress | Stress errors: 'repair' marked RE-pair (it is re-PAIR) and 'thirty' marked thir-ty (it is THIR-ty); '2 May' marked 'second May'. | Rewritten for the new sentence: THIR-ty-DAY, re-PAIR, 'the SEC-ond of MAY'. |
| CSE-A-002 | linking | 'isn't_the → iz-n-the' drops the t rather than linking words. | Replaced with 'or_a' (linking r) for the new sentence. |
| CSE-A-002 | intonation | Intonation described the old word order. | Rewritten for the new order. |
| CSE-A-002 | hindi_meaning | Followed the old sentence; 'वापसी अवधि' did not match the Roman 'return avadhi'. | Rewritten for the new sentence, keeping the speaker's gender forms. |
| CSE-A-002 | hindi_roman | Followed the old sentence. | Transliteration of the new Devanagari. |
| CSE-A-002 | simple_meaning | Followed the old order. | Matches the new sentence. |
| CSE-A-002 | why_it_works | Described the old order (empathy first). | Reason, empathy, options. |
| CSE-A-002 | key_chunk | Frame did not show the empathy step. | Frame now has reason, no, empathy, alternative. |
| CSE-A-002 | grammar_pattern | Followed the old sentence. | Matches the new sentence. |
| CSE-A-002 | positive_swap | Offered a repair with no condition. | Same condition as the main sentence. |
| CSE-A-002 | alt_1 | Empathy before reason, unconditional repair. | Reason, empathy, alternative; repair conditional. |
| CSE-A-002 | alt_2 | Empathy before reason, unconditional repair. | Reason, empathy, alternative; repair conditional. |
| CSE-A-002 | more_formal | Empathy before reason, unconditional repair. | Reason, empathy, alternative; repair conditional. |
| CSE-A-002 | if_customer_pushes | Stated flatly that a fault is covered and skipped the conditional the main sentence now uses. | Conditional wording kept; one clear next question. |
| CSE-A-002 | when_not_to_use | Contradicted the main sentence, which offered a free repair. | Now says to ask why first, then check the warranty. |
| CSE-A-002 | mini_conversation | Quoted the old sentence; the last turn said 'within the hour' while ask_next says one working day. | New sentence; 'I will' plus a time (today, by 5 pm). |
| CSE-A-002 | source_rule | Card teaches avoiding 'policy' but was not marked as derived advice (rules.md 13). | Added the rule and the '(derived advice)' label, as the other policy cards do. |
| CSE-A-002 | fill_blank | 'offer' could also be 'give' (two valid answers). | Blank is the 'but' that turns no into an alternative; only 'but' fits. |
| CSE-A-002 | fill_answer | Matches the new blank. | but |
| CSE-A-002 | mcq_options | Correct option was the longest and the only one with an alternative; A, B, D were short one-liners (one with 'You have to'). | Four options of similar length; B has empathy and a reason but no alternative, D passes the customer on. |
| CSE-A-002 | whats_next_reply | Assumed the machine needs a repair, and had no empathy before the refusal. | Empathy, reason, then two actions with times. |
| CSE-A-003 | stress | Stress map skipped half the sentence. | Full-sentence stress map. |
| CSE-A-003 | hindi_roman | Roman said 'extra payment' but the Devanagari says अतिरिक्त भुगतान. | Roman now transliterates the Devanagari. |
| CSE-A-003 | alt_1 | Said 'our system charged you', the system-blaming wording that dont_say warns against; passive 'were refunded' hid who acted. | 'We charged you' and 'I have refunded'. |
| CSE-A-003 | ask_next | Promised to refund bank fees outright, which an agent may not be able to do. | Agent promises what they control: asking billing, and replying by Friday. |
| CSE-A-003 | if_customer_pushes | Promised a full refund of the fee, and the apology was generic. | Specific apology, then actions the agent controls, with a day. |
| CSE-A-003 | whats_next_reply | Claimed a note on the account would flag duplicate payments (not something an agent can promise); also echoed card 001's reply. | Honest next step with a day, and a safety net for the customer. |
| CSE-A-003 | fill_blank | 'mistake' could also be 'error' or 'fault'. | Blank is now the past participle of the bracketed verb: only 'refunded' fits. |
| CSE-A-003 | fill_answer | Matches the new blank. | refunded |
| CSE-A-003 | mcq_options | Correct option was the longest and the only one that took responsibility; the question gave the answer away. | B and D now apologise too, so the learner must spot the missing ownership and repair. |
| CSE-A-003 | mcq_why | Explanation must match the new options. | Reworded. |
| CSE-A-003 | reorder_task | Only 4 words (audit needs 5+). | Eight words: I'm sorry we charged your card three times. |
| CSE-A-003 | reorder_answer | Matches the new jumble. | Matches the new jumble. |
| CSE-A-004 | stress | Used the contraction i've although the sentence says 'I have'; skipped 'which you can use'. | Matches the written sentence and covers it all. |
| CSE-A-004 | watch_out | The ✗ line used 'the same' (a pronoun use reserved for the cultural note) and was not a learner error in this sentence. | Real learner slips: missing articles, 'apology of', '20$', 'in your account'. |
| CSE-A-004 | if_customer_pushes | Promised the bank's timing ('it will reach you within five working days'). | Agent promises the action and the day; the bank's timing is hedged. |
| CSE-A-004 | mini_conversation | Apology was generic ('I'm sorry it took so long'), against the specific-apology rule. | Specific apology: 'your order arrived nine days late'. |
| CSE-A-004 | fill_blank | 'delay' could also be 'wait', 'inconvenience' or 'problem'. | Blank is the preposition: only 'for' fits, and 'apology of/to' is a real learner slip. |
| CSE-A-004 | fill_answer | Matches the new blank. | for |
| CSE-A-004 | mcq_options | Option C used 'the same' and was an obvious wrong answer; the correct option was the longest. | Four realistic options of similar length: exception, apology, sales push, customer must claim. |
| CSE-A-004 | mcq_why | Explanation must match the new options. | Reworded. |
| CSE-A-005 | stress | 'customer' had no stressed syllable marked. | CUS-tom-er. |
| CSE-A-005 | linking | 'passed_your' was given as pas-tyor while contact_you used the t+y = ch rule; 'from_that → from-that' showed no link at all. | Consistent t+y = ch link, and a real 'to_our' glide. |
| CSE-A-005 | hindi_roman | Roman kept 'Wednesday' but the Devanagari says बुधवार. | Roman now transliterates the Devanagari. |
| CSE-A-005 | watch_out | The ✗ line used 'revert', an Indian-English phrase that should not be shown as an error (rules.md 25); the real slips are the missing article and vague 'soon'. | Kept the missing 'the' and the vague time; 'revert' stays only in the cultural note. |
| CSE-A-005 | fill_blank | 'contact' could also be 'call', 'email' or 'phone'. | Blank is the past participle of the bracketed verb: only 'passed' fits. |
| CSE-A-005 | fill_answer | Matches the new blank. | passed |
| CSE-A-005 | mcq_options | Correct option was by far the longest; A and B were one-line insults, so the answer was obvious. | Four realistic replies of similar length; A and B judge the customer, D is polite but vague. |

PROGRESS: done through CSE-A-005

| ID | field | problem | fix |
|---|---|---|---|
| CSE-A-006 | stress | Stress map skipped 'it took', 'case' and 'is booked'. | Full-sentence stress map. |
| CSE-A-006 | hindi_meaning | 'सार्वजनिक संदेश' is stiff for a customer email and did not match the Roman 'public message'. | 'पब्लिक में मैसेज', the way Indian learners actually say it; Roman matched below. |
| CSE-A-006 | hindi_roman | Roman kept 'Saturday' but the Devanagari says शनिवार. | Roman is now a transliteration of the Devanagari. |
| CSE-A-006 | watch_out | The ✗ line used 'the same' (Indian-English pronoun use) as an error; it belongs only in the cultural note. The real slip here is a generic apology with no owner and no time. | A template apology with no owner and a vague 'soon'. |
| CSE-A-006 | alt_1 | 'single contact' is not the idiom. | 'one point of contact'. |
| CSE-A-006 | fill_blank | 'personally' could also be 'myself' or 'directly'. | Blank is the -ing form of the bracketed verb: only 'handling' fits. |
| CSE-A-006 | fill_answer | Matches the new blank. | handling |
| CSE-A-006 | mcq_options | Correct option was the longest; B used 'the same' and D was an obvious insult. | Four polite options of similar length; A (take down the post) is still the tempting one named in mcq_why. |
| CSE-A-006 | hindi_to_english | Forced a female speaker; the brief asks for both gender forms. | raha/rahi. |
| CSE-A-006 | whats_next_reply | Opened with an unconditional 'Yes', a promise no agent can fully keep, and had no empathy line. | Empathy line, then actions with times. |
| CSE-A-007 | stress | Stress map skipped 'which is why' and 'sign in'. | Full-sentence stress map. |
| CSE-A-007 | linking | 'kept_logging → kep-log-ging' drops the t, contradicting the pronunciation tip that says to keep both final sounds of 'kept'. | Replaced with a real link, which_is. |
| CSE-A-007 | tone_note | 'Kindly' appeared outside the cultural note. | 'Please'; the point (jargon) is unchanged. |
| CSE-A-007 | watch_out | The ✗ line used 'Kindly do the needful' (Indian-English phrasing shown as an error; allowed only in the cultural note). | Real learner slips: 'You have to', missing article, 'install again the app'. |
| CSE-A-007 | mcq_options | Correct option was the longest; B to D were fragments and C used 'Kindly do the needful'. | Four full replies of similar length; only A gives a plain cause and numbered-style steps. |
| CSE-A-007 | whats_next_reply | No apology or empathy before the action. | Specific apology first, then action and a time. |
| CSE-A-008 | stress | 'tracing' was respelt TRAC-ing, which reads as 'tracking'; map also skipped the warehouse team. | TRAY-sing and a full-sentence map. |
| CSE-A-008 | linking | 'where_things' is not a link, and 'processed_but → pro-ses-buht' drops the t against the tip that says to keep 'st'. | Three real links: r-linking, t+y and the w-glide. |
| CSE-A-008 | hindi_meaning | 'रिफ़ंड हो चुका है' loses 'processed'; 'गुम चार्जर' is clipped. | 'प्रोसेस हो चुका है' and 'खोए हुए चार्जर'. |
| CSE-A-008 | hindi_roman | Roman kept 'Friday' while the Devanagari says शुक्रवार; wording changed above. | Transliteration of the new Devanagari. |
| CSE-A-008 | watch_out | The ✗ line showed 'under process' (Indian-English phrase) as an error; that phrase is covered in the cultural note. The real slips are the false 'resolved' and the missing article. | False 'resolved' plus a missing article. |
| CSE-A-008 | alt_2 | Said the charger 'is still with our warehouse team', but the charger is missing, not with them. | States that the team is searching for it. |
| CSE-A-008 | mini_conversation | Promised a replacement 'straight away' although ask_next offers a choice of replacement or refund. | Consistent with ask_next, with a day. |
| CSE-A-008 | fill_blank | 'but' could also be 'while' or 'and'. | Blank is the past participle of the bracketed verb: only 'processed' fits. |
| CSE-A-008 | fill_answer | Matches the new blank. | processed |
| CSE-A-008 | mcq_options | Correct option was the longest; A to C were short slogans, one ('under process') Indian-English. | Four full updates of similar length; B and C are honest but give no date. |
| CSE-A-008 | hindi_to_english | Forced a female speaker. | doonga/doongi. |
| CSE-A-009 | sentence | 'Sorry for the confusion' is as generic as 'sorry for the inconvenience' and hides who made the error; rules.md 8 asks for a specific apology. | 'I'm sorry I gave you the wrong figure'. |
| CSE-A-009 | stress | Map did not cover the changed apology and skipped half the sentence. | Full-sentence stress map (re-PAIR as a noun, FIG-ure). |
| CSE-A-009 | linking | 'not_twenty' reduces a t before a t and no longer sits next to the new apology; a v+y link in 'gave you' is more useful. | Replaced with gave_you. |
| CSE-A-009 | hindi_meaning | Awkward passive 'मुझे कल बताई गई एक बात सही करनी है'; 'उलझन के लिए खेद' followed the old generic apology. | Active 'मैंने आपको कल जो बताया था', and a specific apology. |
| CSE-A-009 | hindi_roman | Followed the old Hindi. | Transliteration of the new Devanagari. |
| CSE-A-009 | simple_meaning | 'still free' is not what the sentence says. | 'still covered by the warranty'. |
| CSE-A-009 | watch_out | The ✗ line used 'the same' (Indian-English pronoun use) as an error. | Names the thing. |
| CSE-A-009 | ask_next | 'I will see what I can do' is a weak, time-less promise (rules.md 9). | 'I will' plus a time. |
| CSE-A-009 | if_customer_pushes | Bare 'I understand' with no ownership. | Specific apology, then action with a day. |
| CSE-A-009 | when_not_to_use | The text said when to use the line, not when it is wrong. | A real situation where the line is wrong. |
| CSE-A-009 | mini_conversation | Quotes the sentence. | Updated to the new sentence. |
| CSE-A-009 | mcq_options | Correct option was the longest; B to D were fragments ('As per records ... only'). | Four full options of similar length; B, C and D correct without owning the error. |
| CSE-A-009 | hindi_to_english | The model answer ('I need to correct something I told you yesterday…') was not a faithful translation of the Hindi prompt. | Prompt now says the same thing as the model answer. |
| CSE-A-010 | stress | 'replying' was marked RE-ply-ing (it is re-PLY-ing); 'duplicate' had no stress mark; map was partial. | Corrected stress and full-sentence map. |
| CSE-A-010 | linking | 'kown' reads like 'own', not the vowel in 'count'. | Clear respelling. |
| CSE-A-010 | hindi_meaning | 'मिला दिए' is vague for merging accounts. | 'मर्ज कर दिए गए हैं'. |
| CSE-A-010 | hindi_roman | Roman did not match the Devanagari (मिला/मर्ज, दोहरा/double). | Transliteration of the Devanagari. |
| CSE-A-010 | fill_blank | 'To ____ up' also accepts 'wrap'. | Blank is the past participle of the bracketed verb: only 'refunded' fits. |
| CSE-A-010 | fill_answer | Matches the new blank. | refunded |
| CSE-A-010 | mcq_options | Correct option was the longest; B and C were curt fragments. | Four full closings of similar length; only A lists the outcomes and gives a way back. |
| CSE-A-010 | hindi_to_english | Model answer included 'you can reply to reopen' that the Hindi prompt did not say; forced a female speaker. | Prompt covers the whole answer; raha/rahi. |
| CSE-A-010 | whats_next_reply | Promised the reply would come 'straight back to me', which an agent cannot guarantee. | Promises only what reopening a ticket does. |

PROGRESS: done through CSE-A-010

| ID | field | problem | fix |
|---|---|---|---|
| CSE-A-011 | sentence | 'Please reply to me first' nudges an unhappy customer to talk to the agent before posting a review, which reads as steering feedback. | Offers a fix without conditions on the review: 'please reply to this email so I can fix it' (also one clear next step, rules.md 22). |
| CSE-A-011 | stress | Used contractions (we've, we'd) that the written sentence does not have; ending followed the old wording. | Matches the written sentence. |
| CSE-A-011 | linking | 'put_things' (t+th) and 'grateful_for' are not real links. | Real links: f+y, w-glide and x+vowel. |
| CSE-A-011 | intonation | Followed the old ending. | Matches the new ending. |
| CSE-A-011 | memory_hook | Followed the old 'talk to me first' wording. | Matches the new wording. |
| CSE-A-011 | hindi_meaning | Followed the old 'first' wording. | Matches the new sentence. |
| CSE-A-011 | hindi_roman | Followed the old wording; 'reply' did not match the Devanagari जवाब. | Transliteration of the Devanagari. |
| CSE-A-011 | simple_meaning | Followed the old wording. | Matches the new sentence. |
| CSE-A-011 | key_chunk | Followed the old wording. | Removed 'first'. |
| CSE-A-011 | watch_out | 'Kindly' appeared in a ✗ line (Indian-English phrasing shown as an error; it belongs in the cultural note). The real fault is pressure for a set score. | Pressure plus a missing article. |
| CSE-A-011 | positive_swap | The swap was framed as stopping a bad review. | Contrasts steering with a plain offer to fix. |
| CSE-A-011 | mini_conversation | Quotes the sentence. | Updated to the new sentence. |
| CSE-A-011 | fill_blank | 'grateful' could also be 'thankful'. | Blank is the preposition: only 'for' fits ('grateful of/to' is a real slip). |
| CSE-A-011 | fill_answer | Matches the new blank. | for |
| CSE-A-011 | mcq_options | Correct option was the longest; A used 'Kindly' and B and C were curt fragments. | Four full requests of similar length; A is polite in form but asks for a set score. |
| CSE-A-011 | reorder_task | Only the old 'first' wording; a 5-word fragment. | The key polite request, eight words. |
| CSE-A-011 | reorder_answer | Matches the new jumble. | Matches the new jumble. |
| CSE-A-011 | whats_next_reply | Claimed it 'takes about a minute' and needs no log-in, which the agent cannot know; no time given for the link. | 'I will' plus today; no unverifiable claims. |
| CSE-A-012 | sentence | 'Nobody called' hides who failed; rules.md 8 asks the agent to take responsibility. | 'We did not call'. |
| CSE-A-012 | stress | Used 'you're' (the sentence says 'you are') and covered about half the sentence. | Full-sentence map for the new wording. |
| CSE-A-012 | linking | 'see_why' and 'nobody_called' are not links. | Real links: st+vowel, l+y, t+vowel. |
| CSE-A-012 | hindi_meaning | Followed the old wording. | 'हमने कॉल नहीं किया'. |
| CSE-A-012 | hindi_roman | Followed the old wording. | 'humne call nahin kiya'. |
| CSE-A-012 | watch_out | Quotes the sentence. | Updated to the new sentence. |
| CSE-A-012 | mini_conversation | Quotes the sentence. | Updated to the new sentence. |
| CSE-A-012 | fill_blank | 'why' could also be 'that' ('I can see that you are angry'). | Blank is the passive participle of the bracketed verb: only 'promised' fits. |
| CSE-A-012 | fill_answer | Matches the new blank. | promised |
| CSE-A-012 | mcq_options | Correct option was the longest; B to D were one-liners. | Four full replies of similar length; B still promises a call but says 'calm down' and 'as soon as possible'. |
| CSE-A-012 | hindi_to_english | Forced a female speaker; '10 baje' did not say 'am'. | Both gender forms; 'subah' added. |
| CSE-A-013 | stress | 'confirmed' was marked CON-firmed; it is con-FIRMED. The map also skipped half the sentence. | Corrected and full-sentence. |
| CSE-A-013 | hindi_meaning | Devanagari and Roman used different words (व्यक्तिगत/personal, दर्ज/registered, पुष्टि होने के बाद/confirm hone ke baad), and 'once we have confirmed it is you' was loosely rendered. | One consistent register and a faithful 'जब हम पुष्टि कर लेंगे कि यह आप ही हैं'. |
| CSE-A-013 | hindi_roman | Did not match the Devanagari. | Transliteration of the new Devanagari. |
| CSE-A-013 | watch_out | 'Kindly' appeared in a ✗ line (belongs in the cultural note). The real fault is asking for far more than is needed. | Over-asking, without the phrase. |
| CSE-A-013 | fill_blank | 'protect' could also be 'verify' or 'secure'. | Blank is the participle after 'Once we have': only 'confirmed' fits. |
| CSE-A-013 | fill_answer | Matches the new blank. | confirmed |
| CSE-A-013 | mcq_options | Correct option was the longest; C used 'Kindly' and over-asked. | Four full replies of similar length: refusal, sending too soon, over-asking and the one-step check. |
| CSE-A-013 | reorder_task | Only 4 words (audit needs 5+). | Eight words. |
| CSE-A-013 | reorder_answer | Matches the new jumble. | Matches the new jumble. |
| CSE-A-013 | whats_next_reply | Gave no time for the date. | 'I will' plus a time. |
| CSE-A-014 | stress | Map covered under half the sentence. | Full-sentence map. |
| CSE-A-014 | linking | 'charged_twice' drops the d and 'above_my' is not a link. | Real links: d+y, v+vowel, z+vowel. |
| CSE-A-014 | hindi_meaning | 'नमस्ते' did not match the Roman 'Hi' and is too formal for an internal note. | 'हाय मीरा'. |
| CSE-A-014 | hindi_roman | Roman used customer/approval limit/Thursday/approve where the Devanagari says ग्राहक/मंज़ूरी सीमा/गुरुवार/मंज़ूर. | Transliteration of the Devanagari. |
| CSE-A-014 | tone_note | 'do the needful' appeared outside the cultural note. | A plain vague request instead; the point (no facts, no ask) is unchanged. |
| CSE-A-014 | watch_out | The ✗ line stacked several Indian-English-only phrases ('Kindly', 'the same', 'do the needful') as an error; they belong in the cultural note. | Vague ask with no amount, ticket number or deadline. |
| CSE-A-014 | fill_blank | 'limit' could also be 'level' or 'authority'. | Blank is 'been' (present perfect passive): only one answer. |
| CSE-A-014 | fill_answer | Matches the new blank. | been |
| CSE-A-014 | mcq_options | Correct option was the longest; A used 'Kindly do the needful at the earliest' and B and C were fragments. | Four full openings of similar length; only D gives the amount, the ask and the deadline. |
| CSE-A-014 | mcq_why | Explanation must match the new option B. | Reworded. |
| CSE-A-014 | hindi_to_english | Forced a female speaker. | raha/rahi. |
| CSE-A-015 | stress | 'extremely' was marked EX-TREME-ly; the stress is on the second syllable (ex-TREME-ly). 'i've' is not in the sentence. | Corrected. |
| CSE-A-015 | linking | 'extremely_disappointed' and 'from_your' are respellings, not links. | Two real consonant-to-vowel links. |
| CSE-A-015 | hindi_meaning | Devanagari said सेवा but the Roman says 'service'. | 'सर्विस' to match the Roman. |
| CSE-A-015 | why_it_works | 'often stronger than angry' is an unsourced generalisation. | Hedged. |
| CSE-A-015 | alt_1 | Nearly identical to the model reply in watch_out and positive_swap (same opening and 'I have read your emails'). | Different wording that names both failures. |
| CSE-A-015 | alt_2 | 'I want to put this right today' is a wish, not 'I will' plus a time (rules.md 9). | 'I will' plus 3 pm. |
| CSE-A-015 | cultural_note | Unsourced claim about how Indian English speakers hear the word. | Framed as a habit of some agents, versus what international customers mean. |
| CSE-A-015 | fill_blank | 'disappointed' could also be 'dissatisfied', 'unhappy' or 'displeased'. | Bracketed base verb: only 'disappointed' fits. |
| CSE-A-015 | mcq_options | Correct option was the longest and C and D were off-topic, so it was answerable by elimination. | All four read as plausible interpretations; the learner must recognise that a calm tone is the warning. |
| CSE-A-015 | mcq_why | Explanation must match the new options. | Reworded. |

PROGRESS: done through CSE-A-015

| ID | field | problem | fix |
|---|---|---|---|
| CSE-A-013 | reorder_task | My new jumble was still in the correct order (audit: not jumbled). | Properly jumbled. |
| ID | field | problem | fix |
|---|---|---|---|
| CSE-A-006 | source_rule | Bracket placeholder [time] (the updated audit allows only [Company]). | Concrete example time. |
| ID | field | problem | fix |
|---|---|---|---|
| CSE-A-016 | stress | Map used 'don't' and 'i'll', but the sentence says 'do not' and 'I will be'. | Matches the written sentence. |
| CSE-A-016 | linking | 'hear_back' and 'taking_this' are not links. | Two real consonant-to-vowel links. |
| CSE-A-016 | watch_out | The ✗ line used 'revert' and 'at the earliest' (Indian-English phrases shown as an error; they belong in the cultural note). The ✓ line thanked an angry customer for 'patience' and gave no date. | Vague ✗ ('soon'); ✓ is a specific apology, an action today and a dated decision. |
| CSE-A-016 | alt_1 | Almost word for word the same as ask_next and the mini conversation. | Different wording and a different structure. |
| CSE-A-016 | if_customer_pushes | No empathy before the action. | Added a short, honest apology. |
| CSE-A-016 | cultural_note | 'I will escalate the matter' is ordinary business English, not an Indian-English habit, so the note claimed a contrast that does not exist. | Reframed as the real gap: agents listening for 'escalate' miss 'take this further'. |
| CSE-A-016 | fill_blank | 'further' could also be 'elsewhere' or 'forward'. | Blank is the -ing form: tests the future continuous the card teaches. |
| CSE-A-016 | fill_answer | Matches the new blank. | taking |
| CSE-A-016 | mcq_options | Correct option was the longest; the others were silly (shop, add items). | Four realistic readings of similar length; A is the tempting 'take it elsewhere' idea. |
| CSE-A-016 | mcq_why | Explanation must match the new options. | Reworded. |
| CSE-A-016 | whats_next_reply | 'Nobody' hides who failed; rules.md 8 asks for responsibility. | 'We did not update you'. |
| CSE-A-017 | watch_out | The ✗ line showed 'As informed earlier' and 'under process' (Indian-English phrases) as errors; they are covered in the cultural note. The real fault is re-sending a defensive template. | A defensive template line without those phrases. |
| CSE-A-017 | if_customer_pushes | No apology before the explanation. | Opens with 'I'm sorry'. |
| CSE-A-017 | fill_blank | 'address' could also be 'answer' or 'cover'. | First-letter hint, so only 'address' fits. |
| CSE-A-017 | mcq_options | Correct option was the longest; B to D were short one-liners. | Four full options of similar length; D is the tempting one named in mcq_why. |
| CSE-A-018 | linking | 'treat_this → tree-this' is not a link. | Replaced with this_email (s + vowel). |
| CSE-A-018 | indian_pron_tip | 'a clear r only if your accent uses it' is not a usable tip. | A concrete stress trap in 'formal'. |
| CSE-A-018 | if_customer_pushes | Went straight to process with no acknowledgement. | Added 'That is a fair question.' |
| CSE-A-018 | fill_blank | 'treat' could also be 'regard', 'log' or 'register'. | Blank is 'as' (treat X as Y); only one answer. |
| CSE-A-018 | fill_answer | Matches the new blank. | as |
| CSE-A-018 | mcq_options | Correct option was the longest; A, C, D were short fragments. | Four full options of similar length; C is the tempting informal fix. |
| CSE-A-019 | stress | Skipped 'that'. | Full sentence. |
| CSE-A-019 | linking | 'led_to → le-tuh' drops the d and 'believe_that' is not a link. | d+t said as one long sound; real links elsewhere. |
| CSE-A-019 | hindi_meaning | 'समझाया गया' means 'was explained to', not 'was led to believe'. | 'यक़ीन दिलाया गया था'. |
| CSE-A-019 | hindi_roman | Followed the old Hindi; 'free' did not match मुफ़्त. | Transliteration of the new Devanagari. |
| CSE-A-019 | alt_2 | 'Sorry for the confusion' is a generic apology (rules.md 8). | Names what went wrong. |
| CSE-A-019 | if_customer_pushes | 'I will still take your word into account' is a vague promise with no action. | A concrete fallback with a time. |
| CSE-A-019 | cultural_note | 'Indian learners may read it as neutral' was an unsupported generalisation. | Hedged and made practical. |
| CSE-A-019 | fill_blank | 'led' could also be 'made' ('made to believe'). | Bracketed base verb: only the irregular participle 'led' fits. |
| CSE-A-019 | mcq_options | Correct option was the longest; A and B were one-liners that insult the customer. | Four full replies of similar length. |
| CSE-A-019 | reorder_task | The jumble ended on a dangling 'that'. | A complete sentence, nine words. |
| CSE-A-019 | reorder_answer | Matches the new jumble. | Matches the new jumble. |
| CSE-A-019 | whats_next_reply | Promised the corrected bill 'within the hour' before seeing the chat, which contradicts when_not_to_use. | Promises a check and a reply time. |
| CSE-A-020 | stress | Used 'i'll' (the sentence says 'I will') and skipped 'and'. | Matches the sentence. |
| CSE-A-020 | linking | 'should_this' is not a link. | Added and_request (d + r). |
| CSE-A-020 | hindi_roman | Roman kept 'Friday' and 'cancel' where the Devanagari says शुक्रवार and रद्द. | Transliteration of the Devanagari. |
| CSE-A-020 | positive_swap | 'I will have this fixed' promises the fix, which when_not_to_use says not to do. | Promises the update only. |
| CSE-A-020 | alt_2 | Almost word for word the same as ask_next and the mini conversation. | Different wording with a specific apology. |
| CSE-A-020 | if_customer_pushes | No empathy before the action. | Added a short apology. |
| CSE-A-020 | cultural_note | 'Indian English rarely uses…' is an unsourced claim. | Framed around the learner's misreading. |
| CSE-A-020 | mini_conversation | Promised 'the full month' without knowing what the customer is owed. | Commits to processing the refund, with a time. |
| CSE-A-020 | mcq_options | Options were very short and the wording did not match the quoted phrase. | Four paraphrases of 'Should this not be resolved' of equal length. |

PROGRESS: done through CSE-A-020

| ID | field | problem | fix |
|---|---|---|---|
| CSE-A-003 | watch_out | The ✗ line showed 'got debited thrice' (Indian-English wording) as an error; those words are explained as a switch in the cultural note. The real fault is the evasive 'due to some technical issue'. | Same evasive wording without 'thrice' and 'got debited'. |
| ID | field | problem | fix |
|---|---|---|---|
| CSE-A-017 | alt_1 | Near-duplicate of ask_next (about 70% shared words). | Different wording, same job. |
| CSE-A-018 | alt_2 | Near-duplicate of ask_next (same logging sentence, reference and date wording). | Different wording, same job. |
| ID | field | problem | fix |
|---|---|---|---|
| CSE-A-007 | fill_blank | 'which' could also be written as 'that' or 'this' (a comma splice learners often use). | First-letter hint, so only 'which' fits. |
| ID | field | problem | fix |
|---|---|---|---|
| CSE-A-019 | alt_1 | Promised to remove the charge 'if you were told…' (the customer's claim), which clashes with the card's own when_not_to_use: no promise before checking. | Condition is now what the record shows. |
| CSE-A-019 | more_formal | Promised to remove the charge 'if you were told…' (the customer's claim), which clashes with the card's own when_not_to_use: no promise before checking. | Condition is now what the record shows. |
| CSE-A-019 | ask_next | Promised to remove the charge 'if you were told…' (the customer's claim), which clashes with the card's own when_not_to_use: no promise before checking. | Condition is now what the record shows. |

## Summary

All 20 cards (CSE-A-001…020) were reviewed field by field. 219 logged changes, by type: MCQ options and explanations 26 (every card's correct option was the longest or the only specific one; all four options are now full, similar-length and plausible, letters unchanged); pronunciation fields 36 (wrong stress such as re-PAIR, con-FIRMED, ex-TREME-ly, re-PLY-ing, THIR-ty; stress maps that skipped half the sentence; "links" that were not links or taught dropping final consonants); fill-the-blank 31 (answers with several valid fits now have a bracketed verb or first-letter hint, or a grammar-only blank); Hindi 32 (unnatural phrasing, Roman not matching Devanagari, forced female speaker, prompts that did not match the model answer); reorder 9 (one 4-word task, one un-jumbled task, one dangling fragment); ✗ lines in watch_out 13 (Indian-English phrases such as "revert", "kindly", "the same", "do the needful", "under process" were shown as errors; they now appear only in cultural notes); other content 72 (reason-then-empathy-then-alternative order in CSE-A-002 per rules.md 23 with a conditional free repair and the "(derived advice)" label; specific apologies and "we" ownership in 009/012; removal of "reply to me first" review steering in 011; promises an agent cannot keep softened in 003/004/006/007/009/019/020; near-duplicate alternatives and replies reworded in 015–020; unsourced Indian-English generalisations hedged in 015/016/019/020; the "[time]" placeholder in CSE-A-006 replaced after audit.py began rejecting brackets other than [Company]).

Final audit: no ERROR or warning mentions cards_EA.txt or any CSE-A ID (only the 160 "card missing" lines for other groups remain).

Left as they were (judgement calls, not errors): reorder tasks for 001, 005, 012 and 014 have more than one natural order; the CSE-A-009 blank "not" could also be "instead of" (two words); CSE-A-014's mini conversation has five turns because it includes the manager's "Approved."; the stress field itself carries no "If read aloud" prefix on email cards (linking, intonation and tip do).

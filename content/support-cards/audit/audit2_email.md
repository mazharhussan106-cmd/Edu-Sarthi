# Audit 2 log: Email channel (CSE-B, CSE-I, CSE-A)

Helper used for every file: work_email/ed.py (exact replacement inside one field of one card; asserts the old text occurs exactly once).

| ID | field | problem | fix |
|---|---|---|---|
| CSE-B-001 | hindi_meaning, hindi_roman | Hindi: "रिक्वेस्ट" is used as feminine; "आपके रिफ़ंड रिक्वेस्ट" is a gender slip | आपकी / Aapki |
| CSE-B-001 | mini_conversation | R1-regression: R1 softened bank timing to "should" in other fields but the agent still promises "It will reach your card" | "It should reach your card" |
| CSE-B-002 | mini_conversation | R1-regression: R1's new last turn opened "Yes," to "can you replace it?", promising a replacement before the warranty check, and "by tomorrow" had no time | "I'll check your warranty now and email you the next step by 3 pm tomorrow." |
| CSE-B-003 | mcq_why | Indian-English form as distractor not framed as a switch | C framed as a common Indian office opening international customers may not expect |
| CSE-B-004 | watch_out | Deck rule: ✗ showed the switch "revert back" | ✗ now a genuine grammar error ("will reply you soon") |
| CSE-B-006 | watch_out | Deck rule: ✗ showed switches ("Kindly", "snap", "the same") | ✗ now a genuine error (missing articles, "attach … with") matching the grammar note |
| CSE-B-006 | mini_conversation | English: "I've sent you a replacement today" after a photo is awkward | "I've booked a replacement lamp for you today." |
| CSE-B-006 | self_check | Switch "the same" listed as something to avoid without the switch framing | Framed: international customers may not expect it |
| CSE-B-008 | watch_out | Deck rule: ✗ showed the Indian support phrase "from our end" | ✗ now a genuine grammar error (unlock / login) |
| CSE-B-008 | mcq_why | Distractor C ("The needful") not framed as a switch | Framed |
| CSE-B-008 | self_check | "avoid 'from our end'" read as a ban on an Indian-English form | Now "say what was fixed, not just …" |
| CSE-B-009 | if_customer_pushes | Promise: agent moved the pickup to Saturday without having checked a slot | "I can see a free slot on Saturday …" |
| CSE-B-010 | watch_out | Deck rule: ✗ showed the switch "revert" | ✗ now the genuine if-clause error "If you will have …" (matches grammar note) |
| CSE-B-010 | ask_next | Duplicate: same line as the sentence of CSE-B-011 | "Kind regards, Meera Nair, [Company]" |
| CSE-B-010 | self_check | Switch not framed | Framed |
| CSE-B-011 | key_chunk | Placeholders [name] [team] [company] (audit ERROR) | "Best regards, ___, ___, [Company]" |
| CSE-B-011 | watch_out | Deck rule: ✗ was the Indian office habit "Thanks & Regards" | ✗ now "Best Regards" (capital R) with no name, the real error the grammar note teaches |
| CSE-B-011 | mini_conversation | Agent says "You're welcome" twice in four turns | Last turn "It was a pleasure, Daniel." |
| CSE-B-011 | fill_blank | Two answers ("regards"/"wishes"); R1 left it open | Clue "(starts with r)" |
| CSE-B-012 | watch_out | Deck rule: ✗ mixed the switch "revert" into the error | ✗ now "I am just follow up …" (grammar) |
| CSE-B-013 | watch_out | Deck rule: ✗ was the switch "the same … herewith" | ✗ now "I have attach … in PDF" (grammar) |
| CSE-B-013 | self_check | Switch not framed | Framed |
| CSE-B-016 | if_customer_pushes | Promise: refund "arranged today" before eligibility was checked | "I'll confirm your refund by 5 pm today." |
| CSE-B-016 | mini_conversation | Promise: "Yes, I've started your refund" before any check | "I'm checking it now, and I'll email you by 5 pm today." |
| CSE-B-017 | watch_out | Deck rule: ✗ was the switch "do the needful" | ✗ now "I have change your delivery address." (grammar) |
| CSE-B-017 | fill_blank | Two answers ("needful"/"necessary"); R1 left it open | Clue "(ends in -ful)" |
| CSE-B-017 | self_check | Switch not framed | Framed |
| CSE-B-019 | positive_swap, ask_next, if_customer_pushes, mini_conversation | Promise: Sunday delivery confirmed without showing a check | Each now "I've checked, and we can …" |
PROGRESS: done cards_EB.txt
| CSE-I-001 | ask_next | Promise: free charger sent before any check was shown | "I've checked your order and arranged for a charger…" |
| CSE-I-001 | mcq_why | Explained only B and C | Added A and D |
| CSE-I-004 | mcq_why | Did not cover A | Added A |
| CSE-I-005 | mcq_why | Did not cover B | Added B |
| CSE-I-006 | if_customer_pushes | Promise: free express upgrade "by Wednesday" offered without checking, for an order still stuck at the warehouse | Agent checks with the warehouse and emails by 3 pm today |
| CSE-I-007 | mini_conversation | Promise: warranty cover and a free repair confirmed before any check | "the one-year warranty should cover it. I'll check your warranty and email you the repair options today." |
| CSE-I-009 | situation | Rules: card promises a time for another team, which when_not_to_use forbids unless they agreed | Situation now says the team agreed to 5 pm Wednesday |
| CSE-I-009 | mcq_why | Did not cover B and C | Added |
| CSE-I-010 | mcq_why | Did not cover B and C | Added |
| CSE-I-010 | fill_blank, fill_answer | Duplicate across the channel: same "following ____ up on my email" task as CSE-B-012 | Blank now tests "so that" (the card's grammar note); answer "so" |
| CSE-I-010 | reorder_task, reorder_answer | Duplicate across the channel: "I'm just following up on my last email" ≈ CSE-B-012's reorder | Now "so that I can complete your claim" |
| CSE-I-011 | mcq_why | Did not cover B and C | Added |
| CSE-I-012 | mcq_why | Did not cover B and C | Added |
| CSE-I-013 | situation, alt_2, ask_next, if_customer_pushes, mini_conversation | Duplicate scenario: Sunday sofa delivery is already CSE-B-019's whole card | Now a wardrobe on a Saturday |
| CSE-I-013 | mcq_why | Did not cover C and D | Added |
| CSE-I-014 | alt_2 | English: "It took longer than it should have, and thank you…" does not join logically | "…, so thank you…" |
| CSE-I-014 | if_customer_pushes | Rules: bare "I'm sorry" (apologise specifically) | "I'm sorry it took ten days." |
| CSE-I-014 | mcq_why | Did not cover A and D | Added |
| CSE-I-014 | self_check | Indian-English stock phrases listed to avoid without the switch framing | Framed |
| CSE-I-015 | mcq_why | Did not cover A and D | Added |
| CSE-I-016 | mini_conversation | Promise: "will be refunded … within 5 to 7 working days" (bank timing) | "I've refunded the £20, and it should reach your card…" |
| CSE-I-016 | mcq_why | Did not cover C and D | Added |
| CSE-I-017 | alt_1 | Accuracy: RF- number called a "bank reference" (the company issues it; CSE-B-018 was fixed the same way in R1) | "the refund reference is RF-28816" |
| CSE-I-017 | mcq_why | Did not cover B and D | Added |
| CSE-I-018 | mcq_why | Did not cover B and C | Added |
| CSE-I-019 | mcq_why | Did not cover A and C | Added |
| CSE-I-020 | mcq_why | Did not cover B and C | Added |
PROGRESS: done cards_EI.txt
| CSE-A-001 | if_customer_pushes | R1-regression: R1's new line promised "a full refund" on collection, before any check of what the customer is owed | Agent checks refund options today and emails by 5 pm |
| CSE-A-001 | mcq_why | Did not cover A and D | Added |
| CSE-A-002 | mcq_why | Did not cover B and D | Added |
| CSE-A-004 | if_customer_pushes | Promise: cash refund instead of credit offered, though the situation only allows a goodwill credit | Agent checks whether the $20 can go to the card and replies by 5 pm |
| CSE-A-005 | situation | Rules: Priya Shah's Wednesday contact is promised on another team's behalf with no sign they agreed | Situation now says the team assigned her and she can contact by Wednesday |
| CSE-A-005 | mcq_why | Did not cover A and B | Added |
| CSE-A-006 | situation | Promise: "an engineer is booked" but the situation never showed a booking (the card's own when_not_to_use forbids this) | Situation now says you have booked the engineer |
| CSE-A-006 | mcq_why | Did not cover B and D | Added |
| CSE-A-007 | mcq_why | Did not cover C and D | Added |
| CSE-A-008 | mcq_why | Did not cover B and C | Added |
| CSE-A-009 | more_formal | Rules: "any confusion this has caused" is the generic apology R1 removed from the sentence | "I apologise for giving you the wrong figure" |
| CSE-A-009 | mcq_why | Did not cover B and D | Added |
| CSE-A-010 | mcq_why | Did not cover B and C | Added |
| CSE-A-011 | mcq_why | Did not cover B and C | Added |
| CSE-A-012 | mcq_why | Did not cover C and D | Added |
| CSE-A-013 | mcq_why | Did not cover A and C | Added |
| CSE-A-014 | mcq_why | Did not cover A and C | Added |
| CSE-A-015 | mcq_why | Did not cover D | Added |
| CSE-A-016 | mcq_why | Did not cover C and D | Added |
| CSE-A-017 | mcq_why | Did not cover B and C | Added |
| CSE-A-017 | self_check | Indian-English template phrase listed to avoid without the framing | Framed |
| CSE-A-018 | mcq_why | Did not cover A and D | Added |
| CSE-A-019 | mcq_why | Did not cover A and B | Added |
| CSE-A-020 | if_customer_pushes | Promise: offered a refund for the dead days before checking what is due | "would you like me to check what refund you are due…" |
| CSE-A-020 | mcq_why | Did not cover C and D | Added |
PROGRESS: done cards_EA.txt

### Cross-channel numbers (one script: work_email/nums.py)
| ID | field | problem | fix |
|---|---|---|---|
| CSE-B-001 | alt_1, alt_2, ask_next, role_play | Order 48213 reused in five Basic cards | Order 62408 |
| CSE-B-002 | whats_next_reply | Same | Order 51736 |
| CSE-B-017 | mini_conversation | Same | Order 39054 |
| CSE-B-011 | ask_next | Ticket #55102 is CSE-B-001's ticket | #55931 |
| CSE-B-018 | if_customer_pushes, mini_conversation, whats_next_reply | RF-55102 reused the same number | RF-57340 |
| CSE-I-009 | sentence, hindi_meaning, hindi_roman, alt_1, alt_2, more_formal, mini_conversation, whats_next_reply | Ticket 48820 is also CSE-A-014's ticket | 48867 |
| CSE-A-005 | whats_next_reply | CR-4471 clashes with phone ending 4471 in CSE-A-012 | CR-4518 |

Deck rule check: rules_check.py lists nothing for CSE- IDs (before and after this round).

## Adversarial pass

Three lenses over all 60 cards (language; practice correctness; service accuracy and safety). One script: work_email/adv.py.

| ID | field | problem | fix |
|---|---|---|---|
| CSE-B-001 | fill_blank | Practice: "Order #55102" also fits the blank | Clue "(starts with T)" |
| CSE-B-002 | mcq_why | Switch "Respected Sir" used as a distractor without the switch framing | Framed: polite in India, international customers may not expect it |
| CSE-B-002 | self_check | Same switch, unframed | Framed |
| CSE-B-003 | hindi_roman | Hindi: "hame" does not match हमें | "hamein" |
| CSE-B-003 | fill_blank | Practice: "replying" / "speaking" also fit | Base verb "(write)" in brackets |
| CSE-B-004 | hindi_roman | Hindi: "Hame" does not match हमें | "Hamein" |
| CSE-B-004 | mcq_why | Distractor B's "under process" not framed as a switch | Framed with "revert back" |
| CSE-B-006 | watch_out | My round-2 ✗ used "attach … with your reply", which many writers accept, so the error was not clear-cut | ✗ keeps only the missing articles ("attach photo of damaged item to your reply") |
| CSE-B-006 | fill_blank | Practice: "with" and "in" also fit the blank | Clue "(starts with t)" |
| CSE-B-006 | self_check | My round-2 wording repeated the second check ("name the item") | "avoid "proof" (distrust) and "the same" (international customers may not expect it)" |
| CSE-B-007 | alt_2 | Accuracy: "now back on your card" states the bank's timing as fact | "I've refunded the delivery charge, and it should reach your card within five working days." |
| CSE-B-013 | fill_blank | Practice: "in a PDF" also fits | Clue "(starts with a)" |
| CSE-B-013 | mcq_why | Distractor B's "kindly" not framed | Framed |
| CSE-B-013 | self_check | My round-2 wording duplicated the first check | First check "name the document and the order"; second "avoid "the same" and "PFA" …" |
| CSE-B-016 | fill_blank | Practice: "enclosed" also fits | Clue "(starts with a)" |
| CSE-B-017 | self_check | My round-2 wording duplicated the second check | "Did you avoid copying "do the needful" back, as international customers may not expect it?" |
| CSE-B-020 | situation | Promise: a free replacement charger is sent with no sign the agent checked | Situation now says you can see the charger is under warranty |
| CSE-I-004 | fill_blank | Practice: "require" also fits | Clue "(starts with n)" |
| CSE-I-005 | fill_blank | Practice: "added" also fits | Base verb "(attach)" |
| CSE-I-011 | channel_note | British spelling: "anytime" | "at any time" |
| CSE-I-013 | self_check | Switch "revert" unframed | Framed |
| CSE-I-014 | self_check | My round-2 wording repeated "thank the customer personally" | "Did you avoid "in this regard" and "kind cooperation", which international customers may not expect?" |
| CSE-I-015 | replies_you_may_hear | Real brand (Chrome) | "The built-in browser on my work laptop." |
| CSE-I-015 | mini_conversation | Real brand (Chrome) | Same |
| CSE-I-019 | fill_blank | Practice: "third", "fourth" also fit the bare sentence | Clue "(2nd)" |

Re-run after the pass: audit.py on cards_EB/EI/EA: 0 errors and 0 warnings for CSE IDs (only the 120 "card missing" lines for other channels). rules_check.py: nothing for CSE IDs.

## Summary

- **Round-1 regressions found: 3.** CSE-B-001 (bank timing left as "will" in the mini conversation), CSE-B-002 (new last turn promised a replacement before the warranty check), CSE-A-001 (new push-back reply promised a full refund before any check). Everything else round 1 changed checks out: changed sentences are carried through watch_out, positive_swap, fill_blank, MCQ, reorder, mini conversations and Hindi; every reorder still matches; and every mcq_why matches its options.
- **Main pass, 87 log rows** (some rows cover several fields): 33 mcq_why lines that explained only one or two options now cover all four. 16 unkeepable promises softened, or the situation now shows the check (refunds, replacements, repairs, bank timing, other teams' deadlines, a slot never checked). 8 watch_out ✗ lines that showed Indian-English switches (revert, kindly, the same, do the needful, from our end, Thanks & Regards) are now genuine learner errors. 9 switch framings in mcq_why and self_check. 7 cross-card number clashes. 3 duplicates of a task or scenario across the channel (CSE-I-010 fill and reorder matched CSE-B-012; CSE-I-013 reused CSE-B-019's Sunday-sofa scenario) and 1 within it (CSE-B-010's ask_next was CSE-B-011's sentence). 2 fill_blanks resolved with a clue (CSE-B-011, CSE-B-017). 2 specific-apology fixes. 1 placeholder (CSE-B-011 key_chunk, the only audit ERROR at the start). 1 Hindi gender fix. 3 English fixes. 1 accuracy fix (the RF- reference called a "bank reference").
- **Adversarial pass: 25 fixes.** 8 fill_blank clues, 5 switch framings, 4 self_checks where my own round-2 edit had created a near-duplicate check, 2 Roman-Hindi spellings, 2 promise or accuracy fixes, 2 real-brand removals, 1 watch_out sharpened, 1 British spelling.
- **Left as they are, deliberately:**
  - CSE-I-006 "Thursday, 18 April" (and "Monday, 5 May" in its Hindi prompt). The weekday and date agree in some years (2024), the pair runs through about 15 fields, and a real delay email names both. Round 1 also left it open.
  - The "As per policy" ✗ lines in CSE-A-002 and CSE-I-007. Their error is hiding behind policy (rules.md 13), a tone error and not only the "as per" switch, and both cards frame "as per" correctly in cultural_note.
  - "hence" in CSE-A-010's ✗ and "will be attended" in CSE-B-014's ✗. Each is a real grammar fault (a fragment; "attended" without "to").
  - Zendesk in CSE-B-011 cultural_note is a hedged source attribution taken from research.md, not a brand in the scenario. Oxford in CSE-B-004, CSE-B-010 and CSE-I-013 is the dictionary citation that rules.md 25 asks for.
  - Order 48213 is still shared by CSE-B-005 (as ORD-48213) and CSE-B-013, where it runs through the sentence and the practice fields.
  - Company refund references (RF-) described as something "your bank can use to trace the payment" (CSE-B-018, CSE-I-017). This is common support wording, though strictly a bank traces by its own reference.
  - Alternatives on Understand-it cards are agent replies in Intermediate and Advanced but customer paraphrases in Basic. Changing this would mean restructuring whole cards, not fixing a defect.

# AUDIT ROUND 2 — regression audit, one channel (60 cards)

You are the second, independent reviewer (senior customer-service trainer + English teacher for Indian learners, native-level English). Round 1 already reviewed and fixed these cards. Your job: (1) prove round 1's fixes are right and broke nothing, and (2) catch what round 1 missed — especially across the three levels of your channel. Work in
/tmp/claude-0/-home-user-Edu-Sarthi/cc73c7e6-63ab-5026-90f9-7a230da3ee48/scratchpad/support/

Read first: schema.py · plan.txt (your channel's three sections) · rules.md · example.txt · audit1_brief.md (the round-1 checklist A–I applies to you too) · the three round-1 logs for your channel (audit1_<XX>.md).

## Resume rule
If your log (audit2_<channel>.md) exists, read it and continue after the last "PROGRESS:" line.

## Step 1 — regression check of round 1 (per file)
For every row in the round-1 log: open the card and confirm the fix is correct and complete. Typical breakages to look for: a changed sentence not updated in watch_out ✓, positive_swap, fill_blank, an MCQ option, reorder_task/answer, mini_conversation or the Hindi fields; an MCQ option reworded so that mcq_why no longer matches, or two options now both defensible; reorder words no longer matching; meaning drift between English and Hindi. Fix anything broken.

## Step 2 — fresh pass over all 60 cards
Apply checklist A–I from audit1_brief.md, and additionally:
- Would a native-speaking support trainer say it exactly this way? Fix stiff, textbook or over-formal lines (and over-casual ones on email).
- Level progression: Basic really simple (A2/B1, short), Intermediate B1/B2, Advanced B2/C1 with genuinely harder situations. No Basic card harder than an Advanced one.
- No two cards in your channel teach the same line, the same mini conversation or the same practice task. Names, amounts and order numbers vary sensibly.
- channel_note statements are accurate, and every card follows rules.md (hold times, specific apology, empathy then action, "I will" + time, no "calm down", no "policy says", security never asks for OTP/PIN/password/CVV/full card number).
- Promises: a firm date or a free replacement/refund is fine ONLY when the card's situation shows the agent has already checked it (e.g. "I can see the replacement is booked for Friday"). Otherwise soften to a real, checkable commitment ("I'll confirm the delivery date by 5 pm today") — never a promise the agent cannot see in the system. Round-1 reviewers left these as open questions: CSC-B-005, CSC-B-014, CSC-B-017 (and any others in the round-1 logs' summaries).
- Fill the blank with two possible answers (e.g. CSE-B-011 "regards"/"wishes", CSE-B-017 "needful"/"necessary"): make it unambiguous with a clue in brackets after the blank, e.g. "Kind ____ (starts with r)", so fill_answer stays the whole word, keeping the format "… ____ … → answer" with exactly one "____". Check this audit's audit.py still passes.
- Indian-English forms (revert, prepone, do the needful, kindly, "the same", May I know, pin code, out of station…) are SWITCHES, not errors — deck-wide rule: watch_out "✗" shows only genuine learner errors (grammar, wrong word, rude tone); the switches live in cultural_note / positive_swap / dont_say. They may appear as an MCQ distractor or self_check item only if the text frames them as "fine in India, but international customers may not expect it". Make your channel consistent with this.
- Placeholders: only [Company] stays. Replace any other bracket placeholder ([number], [date], [name], [link]…) with a concrete made-up value (e.g. ticket #48213, Friday 18 October, Meera, the link in this chat).
- MCQ: answer letters are balanced — do NOT reorder options and do NOT change mcq_answer. Keep exactly one defensible answer, no giveaway by length (the audit allows the correct option to be clearly longest in at most 6 cards per file).

## Procedure
Work file by file (Basic, then Intermediate, then Advanced). For each file: fix with ONE python script of exact string replacements (assert each old text occurs exactly once); append one row per real change to your log `| ID | field | problem | fix |` (title + header the first time) and mark each regression finding with "R1-regression" in the problem column; append `PROGRESS: done <file>`; then run
python3 audit.py cards_<file>.txt | grep -v "card missing"
and fix anything it reports for that file.

Never change id, channel, level, kind, call_stage or speaker; keep each card's teaching point from plan.txt; keep the 56-field format (one "key: value" line per field). Do not touch files outside your channel.

## Deck rule check
Also run `python3 rules_check.py` and fix every line it reports for YOUR channel's IDs. It flags US spellings (use British), "inconvenience" apologies, "policy" in agent lines, agent lines that might ask for a secret, emoji/ALL CAPS in agent lines, "No problem" (keep it only in a casual chat; use "You're welcome" on voice/email or formal lines), Indian-English "pin code" in agent lines (use "postcode"), and "calm down" outside a don't-say context. If a flagged line is genuinely fine, leave it and say why in your log.

## Finish
Run the audit on your three files together until no ERROR mentions them, and rules_check.py until it lists nothing for your channel (or only lines you justified). Add a "## Summary" to your log: number of round-1 regressions found, number of new fixes by type, and anything you deliberately left as it is (with the reason). Reply in one line with those numbers.

# AUDIT ROUND 1 — brief for each reviewer

You are an independent senior reviewer (customer-service trainer + English teacher for Indian learners). Someone else wrote the 20 flashcards in your file. Make them correct, natural and useful. Work in the folder
/tmp/claude-0/-home-user-Edu-Sarthi/cc73c7e6-63ab-5026-90f9-7a230da3ee48/scratchpad/support/

Read first: schema.py (56 fields, hints, min words) · plan.txt (what each card must teach) · rules.md (binding service rules from research) · example.txt (reference card). Consult research.md only if you need a source for a rule.

## Resume rule (important — work may be interrupted by usage limits)
If your log file (audit1_XX.md) already exists, read it. Continue AFTER the last line that starts with "PROGRESS:". Do not redo finished cards.

## Procedure — batches of 5 cards
For each batch (001–005, 006–010, 011–015, 016–020):
1. Read the 5 cards carefully against the checklist below.
2. Apply ALL fixes for the batch with ONE python script that does exact string replacements on your file (for each change: assert the old text occurs exactly once, then replace). Do not rewrite the whole file. Keep the format: "@ID", then 56 "key: value" lines in schema order, one line per value.
3. Append to your log one table row per real change: `| ID | field | problem | fix |` (create the file with a title and the table header the first time).
4. Append a line `PROGRESS: done through <last ID of the batch>`.
5. Run: python3 audit.py <your file> | grep -v "card missing"   and fix anything it reports for these IDs.

## Checklist (every card, every field)
A. English: natural, grammatical, idiomatic for international customers; correct punctuation; British spelling (apologise, cancelled, colour). Agent lines never use Indian-English-only phrasing (do the needful, revert, prepone, kindly, "the same" as a pronoun, May I know, Dear Sir); such phrases may appear only in cultural_note / dont_say / positive_swap, described as "switches for international customers", never as errors. Customer lines may be informal or misspelt where plan.txt says so.
B. Accuracy & honesty: follows rules.md (hold = ask + real time + thank on return; empathy line then action; specific apology instead of "sorry for the inconvenience"; "I will" + a time; never "calm down"; no hiding behind "policy"; warm transfer; verification states its purpose; chat: short messages, no ALL CAPS, no emoji with upset customers; email: specific subject, one clear next step; saying no = reason + empathy + alternative). No invented statistics. No real brands — [Company] only. No promises an agent cannot keep. Security: never ask for an OTP, PIN, password, CVV or full card number. No legal advice or admission of liability beyond the facts.
C. Level: wording suits the card's CEFR (Basic A2/B1 · Intermediate B1/B2 · Advanced B2/C1).
D. "Understand it" cards really train understanding: what the customer means and feels, what to ask next, the best reply.
E. Hindi: Devanagari correct and natural with the same meaning; Roman Hindi matches it; gender forms (देखता/देखती) where the speaker's gender changes the verb.
F. Pronunciation fields: correct dictionary word stress, realistic linking, a tip about a sound that is really in this sentence. For chat/email cards they are "if read aloud" notes.
G. Practice: MCQ has exactly one defensible answer and is not answerable from the question alone; mcq_why matches the options; fill_blank has one unambiguous answer; reorder_task = exactly the words of reorder_answer, 5+ words, jumbled, separated by " / "; hindi_to_english_answer is a correct translation; role_play is concrete; record_task fits the channel (voice/chat: record; email: write and send as text/photo); self_check = exactly 3 checks split by " · ".
H. MCQ options: the answer letters are ALREADY balanced — do NOT reorder options and do NOT change mcq_answer. But the correct option must not be a giveaway: make the four options similar in length and equally plausible (shorten the correct one and/or make distractors fuller and realistic). In your file the correct option may be clearly the longest in at most 6 cards (the audit enforces this). If you change an option's wording, keep mcq_why consistent with it.
I. No duplicates inside a card (alt_1 ≠ alt_2 ≠ sentence) or across your file (no repeated mini conversation, alternative or task).

Never change id, channel, level, kind, call_stage or speaker. Keep each card's teaching point from plan.txt. If you change a card's sentence, update every field that quotes it (watch_out ✓ part, positive_swap, fill_blank, an MCQ option, reorder, mini_conversation, hindi fields…).

## Finish
Run the audit on your file until no ERROR mentions your file or your IDs (the 160 "card missing" lines for other groups are expected). Add a final "## Summary" paragraph to your log with the number of fixes by type. Do not touch any other cards_*.txt file. Reply in one line: number of fixes and anything you could not resolve.

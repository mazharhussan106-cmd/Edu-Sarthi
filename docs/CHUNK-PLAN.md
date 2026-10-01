# Chunk flashcards — plan

Goal: the **Chunk** chip on the Flashcard tab works exactly like **Words** — same
3-side card, gestures, Known/Unknown, Remark, spaced repetition, search, lists,
skip, Record for audit — using `Chunk_Library_Master.xlsx` (1,430 chunks).

## Decisions (owner, 30 Sep 2026)

| Question | Answer |
|---|---|
| Hindi script | **Both**: Devanagari on top, Roman below. Devanagari drafted by Claude, marked for teacher check. |
| Missing content | Claude drafts **only the essential gaps**: Core 220 Hindi meaning + Hindi example (179), and a real example sentence where the sheet has a situation instead (80). All marked "draft". Other empty columns stay empty; the card hides empty fields. |
| Learning order | **Student chooses** Path A (Level 1–5) or Path B (Stage 1–6) the first time they open Chunk; changeable in Settings. Core 220 follow the chosen path, then the other 1,210 by level A1 → A2 → B1, types mixed. |
| Where frames go | **All 1,430 under Chunk**, with a type filter: All · Core · Frames · Prepositions · Collocations · Utterances · Polywords. Grammar chip stays for future grammar content. |

## Technical choices (Claude)

- **ID clash:** the word list already uses `PRP-001…077`. Chunk Preposition Frames `PRP-xxx` are imported as **`PFR-xxx`**. The Excel keeps `PRP`; the importer maps it.
- **Storage:** chunks go in the existing `Word` table with `kind = CHUNK` (the enum already has it), so remarks, reviews, lists, search, skip and audits work unchanged.
  `category` = sheet type, `partOfSpeech` = Lewis type, `cefr` = level, `details` = everything else.
- **One schema change (additive):** a nullable `serialB` column on `Word` for the Path B order (`serial` holds Path A). **No data can be lost** — new column, empty for words.
- **Practice is generated, not written:** gap-fill (from the sheet's own gap-fill, or by blanking the chunk in its example), multiple choice (the chunk vs 3 others from the same group), Hindi → English (from the example pair). No invented content.
- **Separate daily limit:** 10 new chunks a day, counted apart from words (already how counts work per kind).
- Teacher and audit screens say "Chunk:" instead of "Word:" for chunk recordings.

## The card

| Side 1 · Recognition | Side 2 · Understanding | Side 3 · Practice |
|---|---|---|
| Type badge + ID, the chunk (large, sized to fit), 🔊 listen, Level, Group, Topic, Slot ("___ = noun"), When to use, Path stage, Preposition | Hindi (Devanagari + Roman), English example + Hindi example, Watch out ✗ / ✓, Note, Related chunk, Merged from | Gap-fill, Multiple choice, Hindi → English, Say it (own sentence), review plan, See video, **Record yourself for audit** |

Same frame, colours, zoom, PTO on side 2, controls line and card colour as the word card.

## Build order

1. **Data** — copy the Excel into `content/chunk-library/`; `tools/export_json.py` → `chunks.json`; Devanagari in `tools/dev_01…07.txt`, Core 220 drafts in `tools/core_drafts.py`; the export prints a coverage report.
2. **Database** — `serialB` column; `prisma/import-chunks.ts` (idempotent, by ID); added to the GitHub "Database setup" button.
3. **App** — Chunk chip on; type filter; Path A/B chooser (+ Settings); chunk card sides; next-card and counts per path and type; teacher/audit labels.
4. **Check** — typecheck, production build, a Playwright run on a phone screen, screenshots for the owner.
5. **GitHub** — commit locally only. **Nothing is pushed until the owner says so.**

## Status (30 Sep 2026)

Steps 1–4 done and committed locally, not pushed. Checks: chunk flow 25/25, word cards 23/23, student 18/18, teacher 14/14, admin 22/22, production build passes. Gap-fill is available for 1,102 of 1,430 chunks (the rest have no exact match in their example); translation for all 1,430; multiple choice wherever the group has other chunks.

## Update (30 Sep 2026): full card fields, Core merged, paths dropped

Owner's decisions: merge Core 220 into the other types, remove Path A/B, draft
every card field for all 1,430 chunks, data first and the card layout later.

- **Data done:** `tools/rich/rich_01…35.txt` hold Claude's drafts of 30 fields
  per chunk (IPA, linking, Indian pronunciation, stress, register, when to use,
  pronunciation tip, when not to use, memory trick, simple meaning, examples
  2–3, common mistake, grammar pattern, other forms, similar, don't say, reply
  you'll hear, confusing pair, where used, tone, three real-life lines, mini
  conversation, speaking task). `tools/rich_fields.py` merges them; the
  workbook still wins where it has a value. All marked as drafts.
- **Core merged:** each former Core chunk takes its Lewis type (78 →
  utterances, 58 → collocations, 54 → frames, 30 → polywords). IDs stay
  `CORE-xxx`, so links and progress keep working.
- **One order:** A1 → A2 → B1; former Core chunks first inside each level.
- **Code done (1 Oct 2026):** the card now matches the approved mockup and
  the word card — side 1 picture, ID, IPA, linking, Indian pronunciation,
  profile rows and tips; side 2 boxes from meaning to tone; side 3 real-life
  lines, mini conversation, then practice (fill the blank, multiple choice,
  what would you reply, quick recall, translate, speaking task), review plan,
  video and record. The Core 220 chip and the Path A/B chooser (and its
  Settings picker) are gone. `serialB` stays in the schema, unused, so no
  migration and no data loss.

**Grammar split (owner's choice):** 247 frames whose group teaches a grammar
point (Present, Past, Future, Modals, Passive, Reported speech, Conditions,
Tenses, Questions, Comparing, It/There, Verb patterns, Make/let/get, and the 13
"Grammatical chunks") now live in `grammar.json` for the Grammar tab. 1,183
stay in `chunks.json`. Each file has its own A1 → A2 → B1 order. Review
workbooks: `Chunk_Library_Review.xlsx` and `Grammar_Library_Review.xlsx`.

**Grammar tab live (1 Oct 2026):** `prisma/import-chunks.ts` loads
`grammar.json` as kind GRAMMAR (a card moved from chunks keeps its progress and
switches tab). Grammar cards use the chunk card, with "Grammar topic" in place
of the type, and their own hidden "Record yourself" exercise.

**Review audit (1 Oct 2026):** an automated check of all 1,430 cards found
632 cards whose drafted example 2 or 3 repeated example 1 (repeats are now
dropped, so those cards show 2 examples), and 6 cards whose workbook "wrong
version" cell held a label ("Future plan", "Followed by \"to\"") instead of a
mistake (the drafted mistake is used, the label kept as the tip). Left as
they are on purpose: 12 sign-off phrases with no "reply", Hindi that keeps
"ATM"/"AI" in Latin letters, and examples that use an inflected form.

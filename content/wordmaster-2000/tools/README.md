# WordMaster 2000 builder

Builds the 56-column WordMaster workbooks from the Speak Sarthi seed plus the
hand-written fields in this folder.

- `authored.py` — words 1–50 (dict form)
- `b051.py` … `b951.py` — words 51–1000, one tuple per word (action is None for non-verbs):
  `(id, word forms, why it's wrong, memory trick, usage tip, write-your-own,
  (before, during, after), confusing word, difference[, new mistake, new correction])`
- `build.py` — reads the seed, merges the above, writes the workbook

```bash
unzip "10000000 new/SpeakSarthi-full.zip" -d /tmp/ss
SEED_DIR=/tmp/ss/app/src/main/assets/seed \
  python3 content/wordmaster-2000/tools/build.py out.xlsx 51 300
```

To add a batch: write `bNNN.py` in the same tuple form, add it to the import
list at the top of `build.py`, and run with the new range.

Words past 1,000 come from the 910-word workbook (`WM910` env var), skipping any
word the app already has (spelling variants and "run out"/"run out of" count as
the same, as do apologise/apologize, practise/practice, afterwards/afterward and whether/whether…or). Those rows keep their 54 columns; `x1001.py`, `y1051.py` and `y1301.py` supply the 2 new ones.

```bash
SEED_DIR=/tmp/ss/app/src/main/assets/seed \
WM910="10000000 new/WordMaster1000_Words_1001-plus.xlsx" \
  python3 content/wordmaster-2000/tools/build.py out.xlsx 551 1050
```

## Batch 5 — core words (1551–1807)

The first 1,550 skipped many of the most-used words (am/is/are, have, get, say, the/a/an …).
`build5.py` adds them and writes a "Removed" sheet for the repeats and rare words listed in
`removed.py`.

- `h01.py` … `h04.py` — words from the HTML list (`vocabulary_database.json`), 35 fields a line;
  the rest of the 56 columns come from the JSON. `O` dicts replace an unclear JSON field.
- `n01.py` … `n06.py` — words written in full, 52 fields a line (field list at the top of `n01.py`).

## Batch 6 — the last words (1808–2069)

- `g01.py` … `g05.py` — HTML-list words (H format, as above).
- `m01.py` … `m04.py` — words written in full (N format).
- `z910.py` — spelling tip and action sequence for the 45 words taken from the 910-word workbook.
- `removed.py` — `REMOVED_B6` and `NOT_ADDED_B6` say what Batch 6 dropped and why.

## Final file

`final.py` merges all batch files, drops every word in `removed.py`, renumbers 1–2,000 and adds
Removed, Not added and Corrections sheets. It stops if the count is not exactly 2,000, a word or
ID repeats, a cell is blank, a verb has no action sequence, or a Find & Fix line repeats the
Common Mistake.

## Shared pieces

- `sheet.py` — row layout, checks and workbook writing for `build5.py` and `build6.py`.
- `fixes.py` — cell fixes for rows copied from the app seed or the 910 workbook (used by `build.py`
  and `build6.py`).

```bash
cd content/wordmaster-2000
export SEED_DIR=/tmp/ss/app/src/main/assets/seed
export VOCAB_JSON="10000000 new/vocabulary_database.json"
export WM910="10000000 new/WordMaster1000_Words_1001-plus.xlsx"
python3 tools/build5.py WordMaster2000_Batch5_Core_Words_1551-1807.xlsx WordMaster2000_{Sample,Batch1,Batch2,Batch3,Batch4}_*.xlsx
python3 tools/build6.py WordMaster2000_Batch6_Words_1808-2069.xlsx WordMaster2000_{Sample,Batch1,Batch2,Batch3,Batch4,Batch5}_*.xlsx
python3 tools/final.py WordMaster2000_FINAL.xlsx WordMaster2000_{Sample,Batch1,Batch2,Batch3,Batch4,Batch5,Batch6}_*.xlsx
```

The batch builders stop if a row has a blank cell, a word or ID that is already in the list, a verb
with no action sequence, or a Find & Fix line that repeats the Common Mistake.

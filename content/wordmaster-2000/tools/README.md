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
`build5.py` adds them and writes a "Removed" sheet for the 68 repeats and rare words listed
in `removed.py` (applied in the final merged file).

- `h01.py` … `h04.py` — words from the HTML list (`vocabulary_database.json`), 35 fields a line;
  the rest of the 56 columns come from the JSON. `O` dicts replace an unclear JSON field.
- `n01.py` … `n06.py` — words written in full, 52 fields a line (field list at the top of `n01.py`).
- `plan6.json` — what Batch 6 still has to add (261 words).

```bash
cd content/wordmaster-2000
VOCAB_JSON="10000000 new/vocabulary_database.json" \
  python3 tools/build5.py WordMaster2000_Batch5_Core_Words_1551-1807.xlsx WordMaster2000_{Sample,Batch1,Batch2,Batch3,Batch4}_*.xlsx
```

`build5.py` refuses to write the file if a row has a blank cell, a word or ID that is already in
the kept 1,482, or a verb with no action sequence.

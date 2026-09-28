# WordMaster 2000 builder

Builds the 56-column WordMaster workbooks from the Speak Sarthi seed plus the
hand-written fields in this folder.

- `authored.py` — words 1–50 (dict form)
- `b051.py` … `b501.py` — words 51–550, one tuple per word (action is None for non-verbs):
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

# Batch 5 builder: the core words the first 1,550 were missing, plus the removal list.
# Owns: which files make up Batch 5 (h01–h04 from the HTML list, n01–n06 written in full) and its Read Me.
# Does not own: row layout and checks (sheet.py), words 1–1550 (build.py), Batch 6 or the final file.
#
#   VOCAB_JSON="10000000 new/vocabulary_database.json" \
#     python3 build5.py out.xlsx WordMaster2000_{Sample,Batch1,Batch2,Batch3,Batch4}_*.xlsx
import json, os, sys
sys.path.insert(0, sys.path[0])
import h01, h02, h03, h04, n01, n02, n03, n04, n05, n06
from removed import REMOVED, NOT_ADDED
from sheet import fields, h_row, n_row, old_words, check, write_book, headers_from

OUT, OLD = sys.argv[1], sys.argv[2:]
START = 1551
VOCAB = {w["word"].lower(): w for w in json.load(open(os.environ["VOCAB_JSON"]))["words"]}

rows, overridden = [], []
for mod in (h01, h02, h03, h04):
    O = getattr(mod, "O", {})
    for f in fields(mod, 35):
        o = O.get(f[0], {})
        rows.append(h_row(f, o, VOCAB[f[1].lower()]))
        if "mw" in o or "mc" in o:
            cm = VOCAB[f[1].lower()]["common_mistake"]
            overridden.append([f[0], f[1], cm["wrong"], cm["correct"], o.get("mw", cm["wrong"]), o.get("mc", cm["correct"])])
n_h = len(rows)
for mod in (n01, n02, n03, n04, n05, n06):
    rows += [n_row(f) for f in fields(mod, 52)]
rows = [[START + i] + r for i, r in enumerate(rows)]

old = old_words(OLD)
assert len(old) == 1550 and all(i in old for i in REMOVED), (len(old), [i for i in REMOVED if i not in old])
check(rows, old, REMOVED)

END = START + len(rows) - 1
rest = 2000 - (1550 - len(REMOVED) + len(rows))
notes = [
    (f"WordMaster 2000 — Batch 5: words {START}–{END} (core words)", True),
    ("Why this batch is different: the first 1,550 words skipped many of the most-used words in English — "
     "am/is/are, have, do, get, say, know, the/a/an, good/bad, yes/no and others. This batch adds them, "
     f"and lists {len(REMOVED)} words to take out (repeats and rare words) on the 'Removed' sheet.", False),
    (f"Contents: {n_h} words from the HTML word list (its 'Very High' frequency words), then "
     f"{len(rows) - n_h} words written in full for this file: core words that were in none of the lists "
     "(show, bring, colours, 'good morning', 'better/best' …) and 10 HTML-list verbs the first check missed.", False),
    ("What the final check found: my first planning pass treated 'go on' as the same word as 'go', so go, take, "
     "try, keep, turn, move, hold, pass, close and count looked covered when only their phrasal verbs were there. "
     "They are added here, with add, stupid and favourite. Batch 6 will add put on, come on, have to and next the "
     "same way. To stay at 2,000, 'wait for' (a repeat of 'wait') was dropped, and these weaker words will not be "
     "added: " + ", ".join(NOT_ADDED) + ".", False),
    (f"Total after the final merge: 1,550 − {len(REMOVED)} removed + {len(rows)} here + {rest} in Batch 6 = 2,000.", False),
    ("", False),
    ("Where each field came from:", True),
    ("• HTML-list words: part of speech, category, IPA, CEFR, frequency, Hindi meaning, simple explanation, "
     "Example 1, collocations, grammar pattern, common mistake, memory trick, word family, synonyms, antonyms and "
     "the fill-in-the-blank come from vocabulary_database.json. Everything else was written for this file.", False),
    ("• Where the HTML list's mistake line was unclear or changed the meaning, it was replaced — see 'Corrections'.", False),
    ("• New words: every field was written for this file.", False),
    ("• AI-estimated, not from a corpus: CEFR level, frequency, importance.", False),
    ("• Real-life lines are illustrative. They are not real quotes from any film, news outlet or person.", False),
    ("", False),
    ("New ID prefixes: AUX- (helping and modal verbs), DET- (articles and determiners), INT- (interjections and "
     "social phrases). Other IDs continue from the highest number already used (VRB-579, ADJ-469, PHR-333 …).", False),
    ("S.No continues from 1551. The final merged file will renumber 1–2,000 after the removals.", False),
]
sheets = [
    ("Removed", ["Word ID", "Word", "Why it was taken out"], [[i, old[i], why] for i, why in REMOVED.items()], [12, 22, 60]),
    ("Corrections", ["Word ID", "Word", "HTML list's mistake", "HTML list's correction", "New mistake", "New correction"],
     overridden, [12, 14, 40, 40, 40, 40]),
]
write_book(OUT, rows, headers_from(OLD[-1]), sheets, notes, START)
print("saved", OUT, len(rows), "rows,", len(overridden), "corrections,", len(REMOVED), "removed")

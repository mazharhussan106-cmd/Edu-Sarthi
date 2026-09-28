# Extra builder: words after the 2,000 that make the list cover every teachable word in the top 1,000
# of spoken English (OpenSubtitles 2018 frequency list).
# Owns: which files make up the Extra (e01 non-noun gaps, f01–f08 nouns, plus five main-list rows that
# were removed as repeats but are very common in speech) and its Read Me.
# Does not own: row layout and checks (sheet.py), the main 2,000, or the merged file (final.py).
#
#   python3 build7.py out.xlsx WordMaster2000_{Sample,Batch1,Batch2,Batch3,Batch4,Batch5,Batch6}_*.xlsx
import sys
from openpyxl import load_workbook
sys.path.insert(0, sys.path[0])
import e01, f01, f02, f03, f04, f05, f06, f07, f08
from removed import REMOVED, REMOVED_B6, RESTORED_TO_EXTRA
from sheet import fields, n_row, old_words, check, write_book, headers_from

OUT, OLD = sys.argv[1], sys.argv[2:]
START = 2001

new = [n_row(f) for f in fields(e01, 52)]
n_gap = len(new)
for mod in (f01, f02, f03, f04, f05, f06, f07, f08):
    new += [n_row(f) for f in fields(mod, 52)]
n_nouns = len(new) - n_gap

# The five restored rows are copied unchanged from the batch files they were first published in.
restored = {}
for path in OLD:
    for r in list(load_workbook(path, read_only=True).worksheets[1].iter_rows(values_only=True))[2:]:
        if r[1] in RESTORED_TO_EXTRA:
            restored[r[1]] = list(r[1:])
assert set(restored) == set(RESTORED_TO_EXTRA), set(RESTORED_TO_EXTRA) - set(restored)

old = old_words(OLD)
removed = {**REMOVED, **REMOVED_B6}
check([[0] + r for r in new], old, removed, same_word_ok={"mean"})
rows = new[:n_gap] + [restored[i] for i in RESTORED_TO_EXTRA] + new[n_gap:]
rows = [[START + i] + r for i, r in enumerate(rows)]
assert len({r[2].lower() for r in rows}) == len(rows), "duplicate word in Extra"

notes = [
    (f"WordMaster 2000 — Extra: words {START}–{START + len(rows) - 1}", True),
    ("Why this exists: the main 2,000 covered 99% of the 100 most common spoken words, 94% of the top 500 and "
     "91% of the top 1,000 (measured on OpenSubtitles 2018 — film and TV dialogue, 72.5 crore words). These "
     "words take all three to 100% of the teachable words.", False),
    (f"Contents: {n_gap} non-noun words the main list missed (yeah, need, live, mean, going to, gonna, uh/um, "
     f"goodbye …), {len(restored)} words brought back from the Removed list because they are very common in "
     f"speech (somebody, everybody, nobody, anybody, till), and {n_nouns} nouns (people, day, money, phone, "
     "doctor …). The main list had no nouns by design; the top 1,000 cannot be covered without them.", False),
    ("Not included, on purpose: names and titles (John, Mr, Dr, America), swear words, and subtitle marks like "
     "'sighs' or 'chuckles'. Informal spellings ya ('you') and 'em ('them') count as their full words.", False),
    ("", False),
    ("Where each field came from:", True),
    ("• New words: every field was written for this file.", False),
    ("• The five restored words: copied unchanged from the batch they first appeared in.", False),
    ("• AI-estimated, not from a corpus: CEFR level, frequency, importance.", False),
    ("• Real-life lines are illustrative. They are not real quotes from any film, news outlet or person.", False),
    ("", False),
    ("New ID prefix: NOU- (nouns). 'mean' appears twice on purpose: ADJ-366 is 'unkind', VRB-739 is 'signify'.", False),
]
write_book(OUT, rows, headers_from(OLD[-1]), [], notes, START)
print("saved", OUT, len(rows), "rows:", n_gap, "gaps,", len(restored), "restored,", n_nouns, "nouns")

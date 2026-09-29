# How much of real spoken English the list covers, measured on a word-frequency list from film and TV
# subtitles (OpenSubtitles 2018, en_50k.txt from github.com/hermitdave/FrequencyWords).
# Owns: turning list rows into the set of word forms a learner can recognise, and the coverage maths.
# Does not own: which words are in the list.
#
#   FREQ_LIST=en_50k.txt python3 coverage.py WordMaster2000_FINAL.xlsx
import os, re, sys
from openpyxl import load_workbook

# Subtitle tokenisation splits "don't" into "don" + "'t"; these pieces belong to words already in the list.
CONTRACTION_PIECES = {"'s", "'t", "'m", "'re", "'ll", "'ve", "'d", "don", "didn", "doesn", "isn", "wasn", "aren",
                      "weren", "couldn", "wouldn", "shouldn", "haven", "hasn", "hadn", "ain", "won", "can"}
# Informal spellings of words in the list: ya = you, 'em = them, mm = hmm, ma/mama/mum = mom.
INFORMAL = {"ya", "em", "mm", "ma", "mama", "mum", "daddy"}
# Word Forms cells contain notes like "(no other forms)"; these words in them are not forms of the headword.
NOTE_WORDS = {"no", "other", "forms", "form", "adverb", "adjective", "pronoun", "question", "word", "verb", "noun",
              "the", "a", "an", "of", "for", "he", "she", "it", "with", "in", "also", "written", "used", "rare",
              "comparative", "common", "use", "only", "past", "present", "full", "short", "this", "meaning", "from",
              "before", "vowel", "sounds", "and", "or", "not", "more", "most", "is", "are", "was", "were", "uk",
              "us", "plural", "usually", "fixed", "phrase", "sound", "proper", "always", "capital"}


def inflections(w):
    out = {w, w + "s", w + "es", w + "ed", w + "d", w + "ing", w + "er", w + "est"}
    if w.endswith("e"):
        out |= {w[:-1] + "ing", w[:-1] + "er", w[:-1] + "est"}
    if w.endswith("y"):
        out |= {w[:-1] + "ies", w[:-1] + "ied", w[:-1] + "ier", w[:-1] + "iest"}
    if re.search(r"[^aeiou][aeiou][bdgmnprt]$", w):
        out |= {w + w[-1] + "ed", w + w[-1] + "ing", w + w[-1] + "er", w + w[-1] + "est"}
    return out


def covered_forms(rows, forms_col):
    cov = set(CONTRACTION_PIECES) | INFORMAL
    for r in rows:
        w = str(r[2]).lower().strip()
        cov.add(w)
        # A multi-word entry teaches its parts in context: 'of course' → course, 'a lot of' → lot.
        for part in re.findall(r"[a-z']+", w):
            cov |= inflections(part)
        cov |= {f for f in re.findall(r"[a-z']+", str(r[forms_col]).lower()) if f not in NOTE_WORDS}
    return cov


def coverage(rows, forms_col, freq_path):
    toks = [(l.split()[0], int(l.split()[1])) for l in open(freq_path, encoding="utf-8") if l.strip()]
    total = sum(n for _, n in toks)
    cov = covered_forms(rows, forms_col)
    result = {"all": sum(n for w, n in toks if w in cov) / total}
    for top in (100, 500, 1000, 2000):
        part = toks[:top]
        result[top] = sum(n for w, n in part if w in cov) / sum(n for _, n in part)
        result[f"missing_{top}"] = [w for w, _ in part if w not in cov]
    return result


if __name__ == "__main__":
    wb = load_workbook(sys.argv[1], read_only=True)
    headers = list(list(wb.worksheets[1].iter_rows(values_only=True))[1])
    rows = [r for ws in wb.worksheets[1:] if ws.title.startswith(("Words", "Extra"))
            for r in list(ws.iter_rows(values_only=True))[2:] if r[1]]
    res = coverage(rows, headers.index("Word Forms"), os.environ["FREQ_LIST"])
    print(f"{len(rows)} entries · all tokens {100 * res['all']:.1f}%")
    for top in (100, 500, 1000, 2000):
        print(f"top {top}: {100 * res[top]:.1f}% · not covered: {' '.join(res[f'missing_{top}'][:80])}")

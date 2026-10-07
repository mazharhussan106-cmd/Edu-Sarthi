"""Error check for a deck JSON before it becomes a workbook.

Usage:  python audit_cards.py deck.json [--json report.json] [--no-run]

--no-run skips running code snippets (the 56-point code type runs every code
field in a scratch folder and checks that 'output' matches what really prints).

Exit code 1 if there are ERRORS (must fix), 0 if only warnings or clean.
The checks come from real mistakes in past decks: examples repeated inside a
card, a "common mistake" that was a label instead of a wrong sentence, an
opposite listed as a synonym, answers leaking onto side 1, MCQs whose
answer letter is not among the options.
"""
import json
import re
import sys
from collections import defaultdict

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from card_types import TYPES, COMMON, MIN_WORDS, PLACEHOLDERS  # noqa: E402
import hashlib, os, subprocess, tempfile
from concurrent.futures import ThreadPoolExecutor


def norm(s):
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", str(s).lower())).strip()


def options(raw):
    parts = re.split(r"(?:^|\s+)([A-F])\)\s*", raw or "")
    return [(parts[i], parts[i + 1].strip()) for i in range(1, len(parts) - 1, 2)]


def words(s):
    return len(str(s).split())


# ---------------------------------------------------------------- code run-check
_RUN_CACHE = {}


def run_python(code, timeout=8):
    """Run a snippet in a scratch dir. Returns (ok, stdout, error)."""
    key = hashlib.md5(code.encode()).hexdigest()
    if key in _RUN_CACHE:
        return _RUN_CACHE[key]
    with tempfile.TemporaryDirectory() as d:
        try:
            p = subprocess.run([sys.executable, "-c", code], cwd=d, capture_output=True, text=True,
                               timeout=timeout, input="")
            res = (p.returncode == 0, p.stdout, p.stderr.strip().splitlines()[-1] if p.stderr.strip() else "")
        except subprocess.TimeoutExpired:
            res = (False, "", "timed out")
    _RUN_CACHE[key] = res
    return res


def compiles(code):
    for extra in ("", "\n    pass"):
        try:
            compile(code + extra, "<card>", "exec")
            return True, ""
        except SyntaxError as e:
            err = f"{e.msg} (line {e.lineno})"
    return False, err


def prerun(deck):
    """Run all code snippets of a deck in parallel so the per-card checks only look up results."""
    jobs = []
    for c in deck.get("cards", []):
        t = TYPES.get(c.get("type"))
        if not t or not t.get("code_fields"):
            continue
        for k in t["code_fields"]:
            code = str(c.get("fields", {}).get(k, ""))
            if code.strip() and k != "right_code" and "input(" not in code:
                jobs.append(code)
    with ThreadPoolExecutor(8) as ex:
        list(ex.map(run_python, set(jobs)))


def extra_checks(cid, t, f, E, W, run, lang='python'):
    """Checks for the 56-point types: numbers, thin fields, placeholders, code."""
    if not t.get("stars"):
        return
    imp = str(f.get("importance", "")).strip()
    if imp and imp not in ("1", "2", "3", "4", "5"):
        E(cid, f"importance must be a single digit 1-5, got '{imp}'")
    for k, v in f.items():
        if norm(v) in PLACEHOLDERS:
            E(cid, f"'{k}' is a placeholder ('{v}')")
    for k, m in MIN_WORDS.items():
        v = str(f.get(k, "")).strip()
        if v and words(v) < m:
            W(cid, f"'{k}' is thin ({words(v)} words, aim for {m}+)")
    for k in ("word_family", "used_with", "collocations", "related"):
        v = str(f.get(k, "")).strip()
        if v and len([x for x in re.split(r"[,;|]", v) if x.strip()]) < 2:
            W(cid, f"'{k}' needs 2+ items")
    convo = str(f.get("mini_conversation", ""))
    if convo and not ("A:" in convo and "B:" in convo):
        W(cid, "mini_conversation should be an 'A: … | B: …' dialogue")
    if not t.get("code_fields") or lang != "python":
        return
    # fill-in-the-blank: substitute the answers and make sure the code is valid
    fb = str(f.get("fill_blank", ""))
    if "→" in fb and re.search(r"_{2,}", fb):
        p, a = fb.rsplit("→", 1)
        ans = [x.strip() for x in a.split(",")] if a.strip() else []
        blanks = re.findall(r"_{2,}", p)
        if ans and len(blanks) > 1 and len(ans) not in (1, len(blanks)):
            E(cid, f"fill_blank has {len(blanks)} blanks but {len(ans)} answers")
        elif ans and ans != ["4 spaces"]:
            it = iter(ans if len(ans) == len(blanks) else ans * len(blanks))
            filled = re.sub(r"_{2,}", lambda m: next(it), p.replace("¶", "\n"))
            ok, err = compiles(filled.strip())
            if not ok:
                E(cid, f"fill_blank does not compile after filling the answer: {err}")
    if not run:
        return
    for k in t["code_fields"]:
        code = str(f.get(k, ""))
        if not code.strip():
            continue
        if k == "right_code" or "input(" in code:
            ok, err = compiles(code)
            if not ok:
                E(cid, f"'{k}' has a syntax error: {err}")
            continue
        ok, out, err = run_python(code)
        if not ok:
            E(cid, f"'{k}' fails when run: {err}   (wrap deliberate errors in try/except)")
        elif k == "code" and str(f.get("output", "")).strip():
            exp = "\n".join(l.rstrip() for l in str(f["output"]).strip().splitlines())
            got = "\n".join(l.rstrip() for l in out.strip().splitlines())
            if exp != got:
                nondet = re.search(r"random|time|datetime|uuid|id\(", code)
                (W if nondet else E)(cid, f"'output' does not match what 'code' prints. Real output: {got[:80]!r}")


def audit(deck, run=True):
    errors, warnings = [], []
    # Non-Python decks (Git, shell): snippets are not Python, so skip run/compile checks.
    run = run and deck.get("deck", {}).get("language", "python") == "python"
    if run:
        prerun(deck)
    E = lambda cid, m: errors.append(f"{cid}: {m}")
    W = lambda cid, m: warnings.append(f"{cid}: {m}")

    cards = deck.get("cards", [])
    if not cards:
        errors.append("deck: no cards")
    ids = defaultdict(int)
    fronts = defaultdict(list)
    all_examples = defaultdict(list)

    for c in cards:
        cid = c.get("id") or "?"
        ids[cid] += 1
        t = TYPES.get(c.get("type"))
        if not t:
            E(cid, f"unknown type '{c.get('type')}' (use one of {', '.join(TYPES)})")
            continue
        f = c.get("fields", {})
        known = {k for side in t["sides"].values() for k, _, _ in side}
        for k in f:
            if k not in known:
                W(cid, f"field '{k}' is not part of the {c['type']} card and will not appear in the workbook")
        for k, _, _ in COMMON:
            if k != "id" and not c.get(k):
                (E if k in ("source", "topic") else W)(cid, f"missing '{k}'")
        for k in t["required"]:
            if not str(f.get(k, "")).strip():
                E(cid, f"required field '{k}' is empty")

        head = norm(f.get(t["front"][0], ""))
        if head:
            fronts[head].append(cid)

        # Side 1 must not give the answer away.
        for a in t["answers"]:
            ans = str(f.get(a, ""))
            # Short answers (a formula, a date) leak too, but very short ones
            # like "8" would match by accident.
            if len(norm(ans)) < 5:
                continue
            for fk in t["front"]:
                fv = str(f.get(fk, ""))
                if fv and (norm(ans) in norm(fv) or (words(ans) >= 6 and norm(" ".join(ans.split()[:6])) in norm(fv))):
                    E(cid, f"side 1 '{fk}' gives away the answer in '{a}'")
        cue = str(f.get("cue", ""))
        if cue and words(cue) > 30:
            W(cid, "recall cue is long; one short question works better")

        # Examples: no repeats inside the card.
        ex_keys = [k for k in f if k.startswith("example") or k in ("worked_example", "real_world")]
        seen = {}
        for k in ex_keys:
            v = norm(f.get(k, ""))
            if not v:
                continue
            if v in seen:
                E(cid, f"'{k}' repeats '{seen[v]}'")
            seen[v] = k
            all_examples[v].append(cid)

        # Common mistake must be a real wrong statement with its correction.
        mis = str(f.get("misconception", ""))
        if mis:
            if "✗" not in mis or "✓" not in mis:
                E(cid, "common mistake must be '✗ wrong → ✓ right'")
            else:
                wrong = mis.split("✗", 1)[1].split("✓", 1)[0].strip(" →-:")
                right = mis.split("✓", 1)[1].strip()
                if norm(wrong) == norm(right):
                    E(cid, "common mistake: wrong and right are the same")
                if words(wrong) <= 2 and wrong[:1].isupper() and not wrong.endswith((".", "?", "!")):
                    W(cid, f"common mistake '✗ {wrong}' looks like a label, not a wrong statement")

        # MCQ
        if f.get("mcq_question"):
            opts = options(f.get("mcq_options"))
            letters = [k for k, _ in opts]
            if len(opts) < 3:
                E(cid, "MCQ needs 3-4 options written 'A) … B) … C) … D) …'")
            ans = str(f.get("mcq_answer", "")).strip()[:1].upper()
            if ans not in letters:
                E(cid, f"MCQ answer '{f.get('mcq_answer')}' is not one of the options {letters}")
            texts = [norm(v) for _, v in opts]
            if len(set(texts)) < len(texts):
                E(cid, "MCQ has two identical options")
            if ans in letters:
                right = norm(dict(opts)[ans])
                # Whole words only: answer "half" is not given away by "halves".
                # A one-word answer can appear innocently ("each half"), so
                # that is only a warning; a multi-word answer is a real leak.
                if len(right) > 3 and re.search(rf"\b{re.escape(right)}\b", norm(f["mcq_question"])):
                    (E if len(right.split()) > 1 else W)(cid, "MCQ question contains the text of its own answer")

        # Fill the blank
        fb = str(f.get("fill_blank", ""))
        if fb:
            if "→" not in fb:
                E(cid, "fill_blank needs 'sentence with ___ → answer'")
            else:
                p, a = fb.rsplit("→", 1)
                if not re.search(r"_{2,}", p):
                    E(cid, "fill_blank has no ___ blank")
                if not a.strip():
                    E(cid, "fill_blank has no answer after →")
                elif norm(a) and re.search(rf"\b{re.escape(norm(a))}\b", norm(p)):
                    W(cid, "fill_blank answer already appears in the sentence")

        for k in ("apply", "short_answer", "sequence", "what_if", "practice_1", "practice_2", "find_fix"):
            v = str(f.get(k, ""))
            if v and "→" not in v:
                E(cid, f"'{k}' needs 'question → answer'")
        if f.get("find_fix") and "→" in f["find_fix"]:
            w_, r_ = f["find_fix"].rsplit("→", 1)
            if norm(w_) == norm(r_):
                E(cid, "find & fix: wrong and corrected sentences are the same")

        # Similar must not list an opposite.
        syn = {norm(s) for s in re.split(r"[,;·]", str(f.get("synonyms", ""))) if norm(s)}
        ant = {norm(s) for s in re.split(r"[,;·]", str(f.get("antonyms", ""))) if norm(s)}
        if syn & ant:
            E(cid, f"listed as both similar and opposite: {', '.join(sorted(syn & ant))}")
        head_item = norm(f.get(t["front"][0], ""))
        if head_item and head_item in syn:
            E(cid, "similar list contains the item itself")

        for k in ("definition", "meaning", "what", "purpose"):
            if words(f.get(k, "")) > 45:
                W(cid, f"'{k}' is over 45 words; keep one idea per card")
        extra_checks(cid, t, f, E, W, run, deck.get("deck", {}).get("language", "python"))

    for cid, n in ids.items():
        if n > 1:
            errors.append(f"{cid}: ID used {n} times")
    for head, cs in fronts.items():
        if len(cs) > 1:
            errors.append(f"{', '.join(cs)}: same item on side 1 ('{head}') - merge or split clearly")
    for ex, cs in all_examples.items():
        if len(set(cs)) > 1:
            warnings.append(f"{', '.join(sorted(set(cs)))}: same example used on more than one card")
    return errors, warnings


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    deck = json.load(open(sys.argv[1], encoding="utf-8"))
    errors, warnings = audit(deck, run="--no-run" not in sys.argv)
    n = len(deck.get("cards", []))
    print(f"Checked {n} cards: {len(errors)} errors, {len(warnings)} warnings")
    for e in errors:
        print("ERROR  ", e)
    for w in warnings:
        print("warning", w)
    if "--json" in sys.argv:
        out = sys.argv[sys.argv.index("--json") + 1]
        json.dump({"cards": n, "errors": errors, "warnings": warnings}, open(out, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()

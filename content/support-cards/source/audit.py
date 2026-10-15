"""Mechanical audit of the support cards. Usage: python3 audit.py [cards_*.txt ...]
Prints ERROR / warn lines and a count. Content judgement is done by reviewers;
this catches what a machine can: missing fields, wrong formats, mismatches with
the plan, banned agent phrasing, duplicates."""
import glob, re, sys, json
from collections import Counter, defaultdict
from schema import FIELDS, KEYS

HERE = __file__.rsplit("/", 1)[0]
MINW = {k: m for k, _, _, _, m in FIELDS}
DEV = re.compile(r"[ऀ-ॿ]")
# Agent lines must not use these (outdated / Indian-English-only / negative).
BANNED = [r"\bdo the needful\b", r"\brevert back\b", r"\brevert\b", r"\bprepone\b", r"\bkindly\b", r"\bcalm down\b",
          r"\bpolicy says\b", r"\bas per (our )?policy\b", r"\bmay i know\b", r"\bthe same\b(?! (day|time|way|issue|thing|problem|number|address|email|item|order|account|card|amount|page|steps?|charge|team|person|agent|question|details?|error|message))",
          r"\bdear sir\b", r"\bsir/madam\b", r"\bonly\.$", r"\byou have to\b"]
AGENT_LINE_KEYS = ["alt_1", "alt_2", "more_formal", "ask_next", "whats_next_reply", "hindi_to_english_answer", "reorder_answer"]


def parse(paths):
    cards, order = {}, []
    for p in paths:
        cur = None
        for raw in open(p, encoding="utf-8"):
            line = raw.rstrip("\n")
            if line.startswith("@"):
                cur = line[1:].strip(); cards[cur] = {"_file": p}; order.append(cur); continue
            if cur is None or not line.strip() or line.startswith("#"):
                continue
            m = re.match(r"^([a-z_0-9]+):\s?(.*)$", line)
            if m and m.group(1) in KEYS:
                cards[cur][m.group(1)] = m.group(2).strip()
            elif m:
                cards[cur].setdefault("_unknown", []).append(m.group(1))
            else:
                cards[cur].setdefault("_stray", []).append(line[:40])
    return cards, order


def plan():
    rows = {}
    for line in open(f"{HERE}/plan.txt", encoding="utf-8"):
        if line.startswith("CS"):
            i, kind, stage, what = [x.strip() for x in line.split("|")]
            rows[i] = dict(kind="Say it" if kind == "Say" else "Understand it", stage=stage, what=what)
    return rows


def norm(s):
    return re.sub(r"[^a-z0-9 ]", "", s.lower().replace("’", "'")).split()


def audit(cards, order):
    E, W = [], []
    P = plan()
    CH = {"V": "Voice", "C": "Chat", "E": "Email"}
    LV = {"B": "Basic", "I": "Intermediate", "A": "Advanced"}
    CEFR_OK = {"Basic": {"A2", "B1"}, "Intermediate": {"B1", "B2"}, "Advanced": {"B2", "C1"}}
    for i, n in Counter(order).items():
        if n > 1: E.append(f"{i}: duplicate card block")
    missing = set(P) - set(cards)
    for i in sorted(missing): E.append(f"{i}: card missing")
    seen_sent = defaultdict(list)
    for cid in order:
        c = cards[cid]; e = lambda m: E.append(f"{cid}: {m}"); w = lambda m: W.append(f"{cid}: {m}")
        if cid not in P: e("ID not in plan"); continue
        for k in c.get("_unknown", []): e(f"unknown field '{k}'")
        for s in c.get("_stray", []): e(f"stray line '{s}'")
        keys = [k for k in c if not k.startswith("_")]
        if keys != KEYS:
            miss = [k for k in KEYS if k not in c]
            if miss: e(f"missing fields: {', '.join(miss)}")
            elif keys != KEYS: w("fields out of order")
        for k in KEYS:
            v = c.get(k, "")
            if not v: continue
            if MINW[k] and len(v.split()) < MINW[k] and not (k == "hindi_meaning"):
                e(f"'{k}' too thin ({len(v.split())} words, need {MINW[k]})")
            if re.search(r"\b(TBD|TODO|lorem|xxx)\b", v, re.I): e(f"'{k}' has a placeholder")
            for ph in re.findall(r"\[[A-Za-z ]+\]", v):
                if ph != "[Company]": e(f"'{k}' has placeholder {ph}: only [Company] may stay; use a concrete made-up value")
        g = lambda k: c.get(k, "")
        if g("id") != cid: e("id field differs from block ID")
        ch, lv = CH[cid[2]], LV[cid[4]]
        if g("channel") != ch: e(f"channel should be {ch}")
        if g("level") != lv: e(f"level should be {lv}")
        if g("cefr") not in CEFR_OK[lv]: e(f"cefr '{g('cefr')}' not in {sorted(CEFR_OK[lv])}")
        if g("kind") != P[cid]["kind"]: e(f"kind should be {P[cid]['kind']}")
        if g("call_stage") != P[cid]["stage"]: e(f"call_stage should be {P[cid]['stage']}")
        spk = "Agent" if g("kind") == "Say it" else "Customer"
        if g("speaker") != spk: e(f"speaker should be {spk}")
        if g("register") not in ("Formal", "Neutral", "Friendly"): e("register must be Formal/Neutral/Friendly")
        if g("importance") not in list("12345"): e("importance must be one digit 1-5")
        # Side 1 must not give the sentence away in the cue.
        sw = norm(g("sentence")); cw = norm(g("recall_cue"))
        if sw and len(sw) >= 4 and " ".join(sw) in " ".join(cw): e("recall_cue contains the sentence")
        if g("kind") == "Say it" and sw and cw:
            overlap = len(set(sw) & set(cw)) / max(1, len(set(sw)))
            if overlap > 0.7 and len(set(sw)) > 4: w(f"recall_cue repeats {overlap:.0%} of the sentence's words")
        if not DEV.search(g("hindi_meaning")): e("hindi_meaning has no Devanagari")
        if DEV.search(g("hindi_roman")) or DEV.search(g("hindi_to_english")): e("Roman Hindi field contains Devanagari")
        wo = g("watch_out")
        if not ("✗" in wo and "✓" in wo and "→" in wo): e("watch_out must be '✗ … → ✓ …'")
        else:
            a = wo.split("✗", 1)[1].split("✓", 1)[0].strip(" →"); b = wo.split("✓", 1)[1]
            if norm(a) == norm(b): e("watch_out wrong == right")
        if not re.search(r"instead of", g("positive_swap"), re.I) or not re.search(r"\bsay\b|\bwrite\b|\btry\b|\buse\b", g("positive_swap"), re.I):
            e("positive_swap must read 'Instead of …, say …'")
        mc = g("mini_conversation")
        if mc.count("Customer:") < 2 or mc.count("Agent:") < 2: e("mini_conversation needs 2+ Customer: and 2+ Agent: turns")
        if g("replies_you_may_hear").count(" · ") < 1: e("replies_you_may_hear needs 2-3 replies split by ' · '")
        if g("self_check").count(" · ") != 2: e("self_check needs exactly 3 checks split by ' · '")
        fb = g("fill_blank")
        if len(re.findall(r"_{3,}", fb)) != 1: e("fill_blank needs exactly one ____")
        elif g("fill_answer") and re.search(r"\b" + re.escape(g("fill_answer").lower()) + r"\b", fb.lower()):
            w("fill_answer already appears in the fill_blank sentence")
        opts = re.findall(r"(?:^|\|)\s*([A-D])\)\s*([^|]+)", g("mcq_options"))
        if [o[0] for o in opts] != list("ABCD"): e("mcq_options must be 'A) … | B) … | C) … | D) …'")
        elif len({" ".join(norm(o[1])) for o in opts}) != 4: e("mcq_options has duplicate options")
        if g("mcq_answer") not in list("ABCD"): e("mcq_answer must be A-D")
        jumble = [x.strip() for x in g("reorder_task").split("/") if x.strip()]
        if len(jumble) < 5: e("reorder_task needs 5+ words split by ' / '")
        elif sorted(norm(" ".join(jumble))) != sorted(norm(g("reorder_answer"))):
            e("reorder_task words do not match reorder_answer")
        elif norm(" ".join(jumble)) == norm(g("reorder_answer")): e("reorder_task is not jumbled")
        if ch == "Email" and not re.search(r"\bwrite|\btype|\btext\b|\bphoto\b", g("record_task"), re.I):
            e("email record_task should ask to write and send text/photo")
        if ch != "Email" and not re.search(r"record", g("record_task"), re.I):
            e("record_task should ask to record")
        lines = [g(k) for k in AGENT_LINE_KEYS] + ([g("sentence")] if g("kind") == "Say it" else [])
        for ln in lines:
            for b in BANNED:
                if re.search(b, ln, re.I): e(f"agent line uses avoided phrase /{b}/: {ln[:60]!r}"); break
        if "[Company]" not in " ".join(g(k) for k in KEYS) and re.search(r"\b(Amazon|Flipkart|Airtel|Jio|HDFC|ICICI|Paytm|Swiggy|Zomato)\b", " ".join(g(k) for k in KEYS)):
            e("uses a real brand; use [Company]")
        sl = len(g("sentence").split())
        if ch == "Chat" and g("kind") == "Say it" and sl > 30: w(f"chat sentence is long ({sl} words)")
        if ch == "Voice" and g("kind") == "Say it" and sl > 32: w(f"voice sentence is long ({sl} words)")
        seen_sent[" ".join(norm(g("sentence")))].append(cid)
    files = defaultdict(list)
    for cid in order: files[cards[cid]["_file"].rsplit("/", 1)[-1]].append(cid)
    for f, ids in files.items():
        letters = Counter(cards[i].get("mcq_answer") for i in ids)
        n = len(ids)
        if n >= 12:
            lo, hi = max(1, round(n * 0.15)), round(n * 0.35)
            bad = {L: letters.get(L, 0) for L in "ABCD" if not lo <= letters.get(L, 0) <= hi}
            if bad: E.append(f"{f}: MCQ answer letters unbalanced {dict(letters)}; each of A-D should be {lo}-{hi} of {n}")
        longest = []
        for i in ids:
            opts = re.findall(r"(?:^|\|)\s*([A-D])\)\s*([^|]+)", cards[i].get("mcq_options", ""))
            if len(opts) == 4:
                L = sorted(opts, key=lambda o: -len(o[1].strip()))
                if L[0][0] == cards[i].get("mcq_answer") and len(L[0][1].strip()) > len(L[1][1].strip()) + 8:
                    longest.append(i)
        if len(longest) > n * 0.3:
            E.append(f"{f}: correct MCQ option is clearly the longest in {len(longest)}/{n} cards (max {int(n*0.3)}): {', '.join(longest)}")
    for s, ids in seen_sent.items():
        if len(ids) > 1: E.append(f"{', '.join(ids)}: same sentence on two cards")
    return E, W


if __name__ == "__main__":
    paths = sys.argv[1:] or sorted(glob.glob(f"{HERE}/cards_*.txt"))
    cards, order = parse(paths)
    E, W = audit(cards, order)
    for x in E: print("ERROR", x)
    for x in W: print("warn ", x)
    print(f"Checked {len(order)} cards: {len(E)} errors, {len(W)} warnings")
    json.dump({"errors": E, "warnings": W, "cards": len(order)}, open(f"{HERE}/audit_last.json", "w"), indent=1)

import json, os, re, sys
from collections import defaultdict
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.comments import Comment
from openpyxl.utils import get_column_letter
sys.path.insert(0, sys.path[0])
from authored import A
import b051, b101, b151, b201, b251, b301, b351, b401, b451, b501
import b551, b601, b651, b701, b751, b801, b851, b901, b951
from x1001 import X
import y1051, y1301
for _mod in (y1051, y1301):
    # "ID | spelling tip | before ; during ; after" — the action part only for verbs.
    for _line in _mod.TEXT.strip().splitlines():
        _id, _tip, _act = [p.strip() for p in (_line + " |").split("|")[:3]]
        X[_id] = (_tip, tuple(a.strip() for a in _act.split(";")) if _act else None)
for mod in (b051, b101, b151, b201, b251, b301, b351, b401, b451, b501,
            b551, b601, b651, b701, b751, b801, b851, b901, b951):
    for t in mod.R:
        d = dict(forms=t[1], why=t[2], trick=t[3], usage=t[4], own=t[5], action=t[6], cw=t[7], diff=t[8])
        if len(t) > 9:
            d["mw"], d["mc"] = t[9], t[10]
        A[t[0]] = d

# Folder holding the Speak Sarthi seed JSON (unzip "10000000 new/SpeakSarthi-full.zip"; it is app/src/main/assets/seed/).
SEED = os.environ["SEED_DIR"].rstrip("/") + "/"
OUT = sys.argv[1]
START, END = int(sys.argv[2]), int(sys.argv[3])  # 1-based, inclusive
N = END - START + 1

seed_words = sorted(json.load(open(SEED + "words.json")), key=lambda x: x["orderIndex"])
words = seed_words[START - 1:END]


def norm(s):
    # Treat spelling variants and near-duplicates as one headword: apologise/apologize,
    # practise/practice, afterwards/afterward, run out of/run out, whether/whether...or.
    s = s.strip().lower().split("...")[0].strip()
    s = {"practise": "practice"}.get(s, s)
    s = re.sub(r"is(e|ed|ing)$", r"iz\1", s)
    s = re.sub(r"wards$", "ward", s)
    return re.sub(r" (of|on|to|with)$", "", s)


if END > len(seed_words):
    # Past the app's 1,000: take the 910-word workbook (54 columns), skipping words the app already has.
    from openpyxl import load_workbook
    rows = list(load_workbook(os.environ["WM910"], read_only=True)["Words 1001+"].iter_rows(values_only=True))[2:]
    have = {norm(w["word"]) for w in seed_words}
    extra = [r for r in rows if r[2] and norm(str(r[2])) not in have]
    first = max(START, len(seed_words) + 1) - len(seed_words) - 1
    words += [{"wordId": r[1], "_row54": r} for r in extra[first:END - len(seed_words)]]
quiz = {q["wordId"]: q for q in json.load(open(SEED + "quiz_items.json"))}
prac, chunks = defaultdict(list), defaultdict(list)
for p in sorted(json.load(open(SEED + "practice_items.json")), key=lambda x: x["orderIndex"]):
    prac[p["wordId"]].append(p)
for c in sorted(json.load(open(SEED + "chunks.json")), key=lambda x: x["orderIndex"]):
    chunks[c["wordId"]].append(c)

# (section title, fill colour, [(header, is_new)])
SECTIONS = [
    ("1. RECOGNITION", "3F2A8C", ["S.No", "Word ID", "Word", "Part of Speech", "Category", "IPA", "Syllable Break",
        "Hindi Pronunciation", "CEFR Level (AI-estimated)", "Frequency (AI-estimated)", "Importance 1–5 (AI-estimated)", "Register"]),
    ("2. MEANING & USAGE", "0E7C7B", ["Hindi Meaning", "Simple Explanation", "Example 1", "Example 2", "Example 3",
        "Collocations", "Related Phrasal Verbs", "Where It's Used", "Action Sequence (Before → During → After) ★NEW"]),
    ("3. GRAMMAR & ERRORS", "B5452B", ["Grammar Pattern", "Word Forms", "Common Mistake ❌", "Correct Version ✅",
        "Why It's Wrong", "Pronunciation Tip", "Spelling Tip ★NEW"]),
    ("4. MEMORY & WORD-BUILDING", "C07A10", ["Etymology (Origin)", "Prefix / Root / Suffix", "Word Family", "Mnemonic",
        "Memory Trick", "Visual Association", "Emotion / Feel"]),
    ("5. CONVERSATION & COMPARISON", "2E6DB4", ["Synonyms", "Antonyms", "Confusing Word", "Difference Explained",
        "Related Words", "Tone", "Mini Conversation"]),
    ("6. REAL-LIFE USAGE (illustrative, not real quotes)", "6B7280", ["Everyday Scene", "News-Style Line", "Casual Conversation"]),
    ("7. PRACTICE ZONE", "1E8E5A", ["MCQ Question", "MCQ Options", "MCQ Answer", "Fill in the Blank → Answer",
        "Find & Fix → Correct", "Translate (Hindi → English)", "Write Your Own Sentence"]),
    ("8. REVIEW / SPACED REPETITION", "7C3AED", ["Spaced Repetition Plan", "Reverse Quick Recall", "Recall Answer", "Usage Tip"]),
]
HEADERS = [h for _, _, hs in SECTIONS for h in hs]
assert len(HEADERS) == 56, len(HEADERS)


def strip_paren(s):
    # Seed "correct" lines carry the reason in brackets; the reason now has its own column.
    return re.sub(r"\s*\([^()]*\)\s*$", "", s).strip()


def row_for_54(i, w):
    r = list(w["_row54"])
    spelling, action = X[w["wordId"]]
    act = f"Before: {action[0]} → During: {action[1]} → After: {action[2]}" if action else ""
    return [i] + r[1:20] + [act] + r[20:26] + [spelling] + r[26:54]


def row_for(i, w):
    if "_row54" in w:
        return row_for_54(i, w)
    wid, a, q = w["wordId"], A[w["wordId"]], quiz[w["wordId"]]
    ex = [p["text"] for p in prac[wid] if p["type"] == "EXAMPLE"]
    one = lambda t: next((p["text"] for p in prac[wid] if p["type"] == t), "")
    ch = lambda t: [c["text"] for c in chunks[wid] if c["type"] == t]
    letters = "ABCD"
    opts = "  ".join(f"{letters[k]}) {o}" for k, o in enumerate(q["mcq"]["options"]))
    meaning = w["simpleMeaning"].rstrip(".")
    meaning = meaning[0].lower() + meaning[1:]
    return [
        i, wid, w["word"], w["partOfSpeech"], w["category"], w["ipa"], w["syllableBreak"],
        re.sub(r"\s*\(.*\)$", "", w["hindiPronunciation"]), w["cefrLevel"], w["frequency"],
        w["importance"].count("*"), w["register"],
        # 2
        w["hindiMeaning"], f'{w["simpleMeaning"]} {w["plainExplanation"]}', ex[0], ex[1], ex[2],
        ", ".join(ch("COLLOCATION")), ", ".join(ch("PHRASAL")) or "—", ", ".join(w["typicalContexts"]),
        (f"Before: {a['action'][0]} → During: {a['action'][1]} → After: {a['action'][2]}" if a["action"] else ""),
        # 3
        (ch("PATTERN") or [""])[0], a["forms"], a.get("mw", w["commonMistakeWrong"]), a.get("mc") or strip_paren(w["commonMistakeCorrect"]),
        a["why"], w["pronunciationTip"], w["spellingTip"],
        # 4
        w["etymology"], w["prefixRootSuffix"], ", ".join(w["wordFamily"]), w["mnemonic"], a["trick"],
        w["visualAssociation"], w["emotionFeel"],
        # 5
        ", ".join(w["synonyms"]) or "—  (no common synonym)", ", ".join(w["antonyms"]) or "—  (no common antonym)", a["cw"], a["diff"], ", ".join(w["relatedWords"]),
        w["tone"], one("CONVERSATION") or w["miniConversation"],
        # 6
        "Everyday: " + one("EVERYDAY"), "News-style: " + one("NEWS"), "Casual: " + one("CASUAL"),
        # 7
        q["mcq"]["question"], opts, letters[q["mcq"]["answerIndex"]],
        f'{q["fillBlank"]["prompt"]} → {q["fillBlank"]["answer"]}',
        f'{q["findFix"]["wrong"]} → {q["findFix"]["corrected"]}',
        f'{q["translate"]["prompt"]} → {q["translate"]["answer"]}', a["own"],
        # 8
        "Day 1 learn → Day 3 → Day 7 → Day 14 → Day 30 review", f"Which word means '{meaning}'?", w["word"], a["usage"],
    ]


wb = Workbook()
rm = wb.active
rm.title = "Read Me"
ws = wb.create_sheet(f"Words {START}–{END}")

arial = lambda **k: Font(name="Arial", **k)
thin = Side(style="thin", color="D9D9D9")
col = 1
for title, colour, hs in SECTIONS:
    fill = PatternFill("solid", fgColor=colour)
    ws.merge_cells(start_row=1, start_column=col, end_row=1, end_column=col + len(hs) - 1)
    c = ws.cell(1, col, title)
    c.font, c.fill, c.alignment = arial(sz=11, b=True, color="FFFFFF"), fill, Alignment(vertical="center")
    for k, h in enumerate(hs):
        c = ws.cell(1, col + k)
        c.fill = fill
        c = ws.cell(2, col + k, h)
        new = "★NEW" in h
        c.font = arial(sz=10, b=True, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor="E8590C") if new else fill
        c.alignment = Alignment(wrap_text=True, vertical="center")
        if new:
            c.comment = Comment("New column, not in the 54-column reference. Added from the "
                                "Premium Flashcard Master Specification.", "Claude")
    col += len(hs)

from fixes import FIX


def fixed(row):
    for header, value in FIX.get(row[1], {}).items():
        row[HEADERS.index(header)] = value
    return row


for i, w in enumerate(words, start=1):
    for j, v in enumerate(fixed(row_for(START + i - 1, w)), start=1):
        c = ws.cell(i + 2, j, v)
        c.font = arial(sz=10)
        c.alignment = Alignment(wrap_text=True, vertical="top")
        c.border = Border(bottom=thin)
    ws.row_dimensions[i + 2].height = 150

ws.row_dimensions[2].height = 42
ws.column_dimensions["A"].width = 7
for j in range(2, 57):
    ws.column_dimensions[get_column_letter(j)].width = 22
for j in (14, 21, 25, 26, 38, 42):  # long-text columns
    ws.column_dimensions[get_column_letter(j)].width = 34
ws.freeze_panes = "D3"
ws.auto_filter.ref = f"A2:{get_column_letter(56)}{N + 2}"

notes = [
    (f"WordMaster 2000 — Batch: words {START}–{END}", True),
    (f"What this is: words {START}–{END} of the planned 2,000 non-noun words, in the 56-column format "
     "(the 54-column WordMaster reference + 2 new columns). Same format as the 50-word sample.", False),
    (f"Contents: {sum(1 for w in words if '_row54' not in w)} words from the Speak Sarthi app, in the app's own order"
     + (f", then {sum(1 for w in words if '_row54' in w)} from the 910-word workbook (words 1001+), skipping any "
        "the app already has — including spelling variants like apologise/apologize and near-duplicates like "
        "run out / run out of. Those rows keep their original 54 columns; only the 2 new columns were added."
        if any('_row54' in w for w in words) else "."), False),
    ("", False),
    ("The 2 new columns (orange headers, marked ★NEW):", True),
    ("• Action Sequence (Before → During → After) — in section 2. Filled for verbs and phrasal verbs; "
     "it will be blank for adjectives, adverbs and other non-verbs.", False),
    ("• Spelling Tip — in section 3, next to Pronunciation Tip.", False),
    ("Both come from the Premium Flashcard Master Specification.", False),
    ("", False),
    ("Where each field came from:", True),
    ("• Taken from the Speak Sarthi app content: IPA, syllable break, Hindi pronunciation "
     "and meaning, category, register, explanations, examples, collocations, phrasal verbs, grammar pattern, "
     "common mistake, etymology, root, word family, mnemonic, visual association, emotion, synonyms, antonyms, "
     "related words, tone, mini conversation, real-life lines, spelling tip, and all quiz items.", False),
    ("• Newly written for this file: Word Forms, Why It's Wrong, Memory Trick, Usage Tip, Write Your Own "
     "Sentence, Action Sequence, Confusing Word and Difference Explained.", False),
    ("• Built from other fields: Reverse Quick Recall (from the simple meaning), Recall Answer (the word), "
     "Correct Version (the app's correct line, with the reason moved to 'Why It's Wrong').", False),
    ("• Common Mistake / Correct Version were replaced for the words listed on the 'Corrections' sheet, "
     "where the app's example was not a real error or the correction changed the meaning.", False),
    ("• AI-estimated, not from a corpus: CEFR level, frequency, importance.", False),
    ("• Real-life lines are illustrative. They are not real quotes from any film, news outlet or person.", False),
    ("", False),
    ("Word IDs: kept from the Speak Sarthi app (VRB-…, PHR-…) so rows can be matched back to the app.", False),
    ("Spaced repetition plan: Day 1 → 3 → 7 → 14 → 30, same as the 910-word workbook.", False),
]
rm.column_dimensions["A"].width = 120
for r, (t, bold) in enumerate(notes, start=1):
    c = rm.cell(r, 1, t)
    c.font = arial(sz=12 if r == 1 else 10, b=bold)
    c.alignment = Alignment(wrap_text=True, vertical="top")

cs = wb.create_sheet("Corrections")
hdr = ["Word ID", "Word", "App's original mistake", "App's original correction", "New mistake", "New correction"]
for j, h in enumerate(hdr, start=1):
    c = cs.cell(1, j, h)
    c.font, c.fill = arial(sz=10, b=True, color="FFFFFF"), PatternFill("solid", fgColor="3F2A8C")
    cs.column_dimensions[get_column_letter(j)].width = 14 if j < 3 else 44
fixed = [w for w in words if "mw" in A.get(w["wordId"], {})]
for r, w in enumerate(fixed, start=2):
    a = A[w["wordId"]]
    for j, v in enumerate([w["wordId"], w["word"], w["commonMistakeWrong"], w["commonMistakeCorrect"], a["mw"], a["mc"]], start=1):
        c = cs.cell(r, j, v)
        c.font, c.alignment = arial(sz=10), Alignment(wrap_text=True, vertical="top")
cs.freeze_panes = "A2"

wb.save(OUT)
print("saved", OUT, len(words), "rows")

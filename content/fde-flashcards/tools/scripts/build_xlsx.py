"""Builds the flashcard review workbook from a deck JSON.

Usage:  python build_xlsx.py deck.json out.xlsx

Sheets:
  Read Me   - how to study with the cards, colour legend, review plan
  <Type>    - one sheet per card type used; columns grouped by side, then the
              learner's own tracking columns (status, review days, OK/Fix, note)
  Summary   - counts by topic, level, type and source, plus the error check

Cells Claude added beyond the learner's own source are shaded, so a self
learner knows which parts to double-check. The audit is re-run here and its
result written into Summary; the build still works with warnings.

Deck JSON:
{
  "deck": {"title": "...", "subject": "...", "learner": "...", "source": "..."},
  "cards": [
    {"id": "PHY-001", "type": "concept", "topic": "...", "level": "Core", "order": 1,
     "source": "File p.12", "added": ["memory_hook", "example_2"],
     "fields": {"term": "...", "cue": "...", ...}}
  ]
}
"""
import json
import re
import sys
from collections import Counter

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
import math

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from audit_cards import audit  # noqa: E402
from card_types import COMMON, REVIEW_DAYS, SIDE_NAMES, TYPES  # noqa: E402

BAND = {0: "374151", 1: "1F3A68", 2: "0F7F74", 3: "B35500", 4: "5B21B6", 5: "475569"}
HEAD = {0: "E5E7EB", 1: "DBE4F3", 2: "D5EFEC", 3: "F8E3CF", 4: "E9DDFB", 5: "E2E8F0"}
CODE_KEYS = {"code", "output", "syntax", "example_1", "example_2", "example_3", "variation", "wrong_code", "right_code", "task_answer", "practice_question", "practice_answer", "fill_blank"}
ADDED = PatternFill("solid", fgColor="FFF4D6")
THIN = Side(style="thin", color="D1D5DB")
BOX = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
WRAP = Alignment(wrap_text=True, vertical="top")
TRACK = [("status", "Status"), *[(f"day_{d}", f"Day {d}") for d in REVIEW_DAYS], ("ok_fix", "OK / Fix"), ("my_note", "My note")]
WIDE = {"definition", "explanation", "what", "causes", "effects", "steps", "worked_example", "misconception",
        "mcq_question", "mcq_options", "fill_blank", "apply", "short_answer", "mini_conversation", "explain_task",
        "example_1", "example_2", "example_3", "example", "real_world", "cue", "contrast", "sequence", "what_if",
        "origin", "pro_tip", "memory_story", "visual", "emotion", "simple_explain", "analogy", "variation", "code", "output", "where_used",
        "real_project", "real_interview", "real_daily", "wrong_code", "right_code", "practice_question", "practice_answer", "task_answer",
        "hindi_to_task", "own_task", "confused_with", "avoid", "find_fix", "collocations", "word_family", "typing_hint", "memory_trick"}


def put(cell, v, formula=False):
    """Write a value; text that starts with = + - @ is forced to text so Excel never reads it as a formula."""
    cell.value = v
    if not formula and isinstance(v, str) and v[:1] in "=+-@":
        cell.data_type = "s"


def est_height(values_widths):
    lines = 1
    for v, w in values_widths:
        if v:
            lines = max(lines, sum(math.ceil(max(len(l), 1) / max(w * 1.05, 1)) for l in str(v).split("\n")))
    return min(409, max(30, lines * 13.5))


def is_claude(card):
    return "claude" in str(card.get("source", "")).lower()


def card_sheet(wb, type_key, cards):
    t = TYPES[type_key]
    # Excel forbids / \\ ? * [ ] : in sheet names.
    ws = wb.create_sheet(re.sub(r"[/\\?*\[\]:]", "-", f"{t['label']} cards")[:31])
    cols = [(k, l, 0) for k, l, _ in COMMON]
    for side in (1, 2, 3):
        cols += [(k, l, side) for k, l, _ in t["sides"][side]]
    if t.get("stars"):
        cols += [("_stars", "Importance ★", 5), ("_recall", "Quick recall (reverse)", 5)]
    cols += [(k, l, 4) for k, l in TRACK]

    # Row 1: side bands; row 2: field labels.
    start = 1
    for i in range(1, len(cols) + 1):
        if i == len(cols) or cols[i][2] != cols[start - 1][2]:
            side = cols[start - 1][2]
            name = {0: "Card", 4: "My review", 5: "Auto"}.get(side, SIDE_NAMES.get(side))
            ws.merge_cells(start_row=1, start_column=start, end_row=1, end_column=i)
            cell = ws.cell(1, start, name)
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = PatternFill("solid", fgColor=BAND[side])
            cell.alignment = Alignment(horizontal="center")
            start = i + 1
    for j, (k, label, side) in enumerate(cols, 1):
        c = ws.cell(2, j, label)
        c.font = Font(bold=True)
        c.fill = PatternFill("solid", fgColor=HEAD[side])
        c.alignment = WRAP
        c.border = BOX
        ws.column_dimensions[get_column_letter(j)].width = 42 if (k in WIDE or k == "_recall") else (9 if k.startswith("day_") else 18)

    cards = sorted(cards, key=lambda c: (c.get("order") or 10**6, c.get("id", "")))
    keys = [k for k, _, _ in cols]
    L = lambda key: get_column_letter(keys.index(key) + 1)
    for r, card in enumerate(cards, 3):
        f = card.get("fields", {})
        added = set(card.get("added", []))
        heights = []
        for j, (k, _, side) in enumerate(cols, 1):
            cell = ws.cell(r, j)
            cell.alignment = WRAP
            cell.border = BOX
            if k == "_stars":
                imp = L(t["stars"])
                put(cell, f'=IF({imp}{r}="","",REPT("★",{imp}{r})&REPT("☆",5-{imp}{r})&" ("&{imp}{r}&"/5)")', True)
                continue
            if k == "_recall":
                nat, head = t["recall"]
                put(cell, f'=IF({L(nat)}{r}="","","Meaning: "&{L(nat)}{r}&"  =  ______   (Answer: "&{L(head)}{r}&")")', True)
                continue
            v = card.get(k) if side == 0 else (f.get(k, "") if side in (1, 2, 3) else "")
            if v not in (None, ""):
                v = int(v) if k == "importance" and str(v).isdigit() else v
                put(cell, v)
                if k in CODE_KEYS and t.get("code_fields"):
                    cell.font = Font(name="Consolas", size=10)
            if side in (1, 2, 3) and v and (is_claude(card) or k in added):
                cell.fill = ADDED
            heights.append((v, ws.column_dimensions[get_column_letter(j)].width))
        ws.row_dimensions[r].height = est_height(heights)
        ws.cell(r, cols.index(("status", "Status", 4)) + 1, "New")

    last = len(cards) + 2
    if cards:
        sc = get_column_letter([k for k, _, _ in cols].index("status") + 1)
        ok = get_column_letter([k for k, _, _ in cols].index("ok_fix") + 1)
        dv = DataValidation(type="list", formula1='"New,Learning,Known"', allow_blank=True)
        dv2 = DataValidation(type="list", formula1='"OK,Fix"', allow_blank=True)
        ws.add_data_validation(dv)
        ws.add_data_validation(dv2)
        dv.add(f"{sc}3:{sc}{last}")
        dv2.add(f"{ok}3:{ok}{last}")
    ws.freeze_panes = "C3"
    ws.auto_filter.ref = f"A2:{get_column_letter(len(cols))}{last}"


SIDE_COLOR = {1: "1F5FA8", 2: "2F7D4F", 3: "C2561A"}


def card_view(wb, type_key, cards, sheet_name):
    """A one-card-at-a-time page: pick an ID in the dropdown, the card appears Front / Back / Practice."""
    t = TYPES[type_key]
    src = wb[sheet_name]
    cards = sorted(cards, key=lambda c: (c.get("order") or 10**6, c.get("id", "")))
    n = len(cards)
    last = n + 2
    quoted = "'" + sheet_name.replace("'", "''") + "'"
    ncols = src.max_column
    last_col = get_column_letter(ncols)
    ws = wb.create_sheet(f"{t['view'].title()} card view"[:31])
    ws.sheet_view.showGridLines = False
    ws.column_dimensions["A"].width = 28
    ws.column_dimensions["B"].width = 100
    ws["A1"] = f"{t['label']} · card view"
    ws["A1"].font = Font(bold=True, size=16, color="1F3864")
    ws["A2"] = "Card ID chuno ▸"
    ws["A2"].font = Font(bold=True)
    ws["B2"] = cards[0]["id"]
    ws["B2"].font = Font(bold=True, size=12, color="C00000")
    ws["B2"].fill = PatternFill("solid", fgColor="FFF2CC")
    ws["B2"].border = BOX
    dv = DataValidation(type="list", formula1=f"={quoted}!$A$3:$A${last}", allow_blank=False)
    ws.add_data_validation(dv)
    dv.add("B2")
    rng = f"{quoted}!$A$3:${last_col}${last}"
    hdr = f"{quoted}!$A$2:${last_col}$2"
    labels = {k: l for k, l, _ in sum(([x for x in t["sides"][s_]] for s_ in (1, 2, 3)), [])}
    for k, l, _ in COMMON:
        labels[k] = l
    labels["_stars"] = "Importance ★"
    labels["_recall"] = "Quick recall (reverse)"
    r = 4

    def band(title, color):
        nonlocal r
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2)
        c = ws.cell(r, 1, title)
        c.font = Font(bold=True, color="FFFFFF", size=12)
        c.fill = PatternFill("solid", fgColor=color)
        c.alignment = Alignment(horizontal="center")
        r += 1

    def row(label, key):
        nonlocal r
        a = ws.cell(r, 1, label)
        a.font = Font(bold=True, color="1F3864")
        a.alignment = WRAP
        a.border = BOX
        a.fill = PatternFill("solid", fgColor="F2F2F2")
        b = ws.cell(r, 2, f'=INDEX({rng},MATCH($B$2,{quoted}!$A$3:$A${last},0),MATCH("{label}",{hdr},0))&""')
        b.alignment = WRAP
        b.border = BOX
        if key in CODE_KEYS and t.get("code_fields"):
            b.font = Font(name="Consolas", size=10)
        vals = [str(c.get("fields", {}).get(key, "")) for c in cards]
        ws.row_dimensions[r].height = est_height([(max(vals, key=len) if vals else "", 100)])
        r += 1

    band("FRONT · Recognition (pehchano)", SIDE_COLOR[1])
    row("ID", "id")
    row("Topic", "topic")
    row("Level", "level")
    for k, l, _ in t["sides"][1]:
        row(l, k)
    if t.get("stars"):
        row("Importance ★", "_stars")
    band("BACK · Understanding (samjho)", SIDE_COLOR[2])
    for k, l, _ in t["sides"][2]:
        row(l, k)
    band("PRACTICE · Khud karo", SIDE_COLOR[3])
    for k, l, _ in t["sides"][3]:
        row(l, k)
    if t.get("recall"):
        row("Quick recall (reverse)", "_recall")
    ws.freeze_panes = "A4"


def anki_sheets(wb, deck_cards, out_path):
    """Plain-value Anki sheets plus two tab-separated files ready for Anki's File > Import."""
    def val(f, k):
        return str(f.get(k, "")).strip()

    def html(x):
        return x.replace("\n", "<br>")

    card_rows, quiz_rows = [], []
    for c in sorted(deck_cards, key=lambda c: (c.get("order") or 10**6, c.get("id", ""))):
        t = TYPES.get(c.get("type"))
        if not t:
            continue
        f = c.get("fields", {})
        head = val(f, t["front"][0])
        cue = val(f, "cue")
        front = head + (f"\n\n{cue}" if cue else "")
        if t.get("code_fields") and val(f, "code"):
            front += f"\n\n{val(f, 'code')}"
        back = []
        for k, l, _ in t["sides"][2]:
            if val(f, k):
                back.append(f"{l.upper()}:\n{val(f, k)}")
        tags = re.sub(r"\s+", "_", f"{c.get('topic', '')} {c.get('level', '')} {c.get('id', '')}".strip())
        card_rows.append((front, "\n\n".join(back), tags))
        q = []
        if val(f, "mcq_question"):
            q.append(f"MCQ: {val(f, 'mcq_question')}\n{val(f, 'mcq_options')}")
        if val(f, "fill_blank") and "→" in val(f, "fill_blank"):
            q.append("FILL: " + val(f, "fill_blank").rsplit("→", 1)[0].strip())
        for k in ("hindi_to_task", "apply", "practice_question", "find_fix", "short_answer", "sequence", "practice_1"):
            if val(f, k):
                q.append(f"{k.replace('_', ' ').upper()}: {val(f, k).split('→')[0].strip()}")
        a = []
        if val(f, "mcq_answer"):
            a.append(f"MCQ answer: {val(f, 'mcq_answer')}  {val(f, 'mcq_why')}".strip())
        if val(f, "fill_blank") and "→" in val(f, "fill_blank"):
            a.append("Fill answer: " + val(f, "fill_blank").rsplit("→", 1)[1].strip())
        for k in ("task_answer", "practice_answer"):
            if val(f, k):
                a.append(f"{k.replace('_', ' ').capitalize()}:\n{val(f, k)}")
        for k in ("apply", "short_answer", "find_fix", "sequence", "practice_1"):
            if "→" in val(f, k):
                a.append(f"{k.replace('_', ' ').capitalize()}: {val(f, k).split('→', 1)[1].strip()}")
        if q:
            quiz_rows.append(("\n\n".join(q), "\n".join(a), tags + "_quiz"))

    base = out_path.rsplit(".", 1)[0]
    for name, rows, suffix, widths in (("Anki Import", card_rows, "anki_cards.tsv", (55, 90, 30)), ("Anki Quiz", quiz_rows, "anki_quiz.tsv", (65, 70, 30))):
        ws = wb.create_sheet(name)
        ws.append(["Front", "Back", "Tags"])
        for c in ws[1]:
            c.font = Font(bold=True, color="FFFFFF")
            c.fill = PatternFill("solid", fgColor="1F3864")
        for fr, bk, tg in rows:
            ws.append([fr, bk, tg])
        for r_ in range(2, len(rows) + 2):
            for c_ in (1, 2, 3):
                cell = ws.cell(r_, c_)
                put(cell, cell.value)
                cell.alignment = WRAP
            ws.row_dimensions[r_].height = est_height([(rows[r_ - 2][0], widths[0]), (rows[r_ - 2][1], widths[1])])
        for i, w in enumerate(widths, 1):
            ws.column_dimensions[get_column_letter(i)].width = w
        ws.freeze_panes = "A2"
        with open(f"{base}_{suffix}", "w", encoding="utf-8", newline="") as fh:
            for fr, bk, tg in rows:
                fh.write("\t".join(html(x.replace("\t", " ")) for x in (fr, bk, tg)) + "\n")
    return len(card_rows), len(quiz_rows)


def read_me(ws, deck, cards):
    d = deck.get("deck", {})
    rows = [
        (d.get("title") or "Flashcards", True),
        (f"Subject: {d.get('subject', '')}   ·   Learner: {d.get('learner', '')}   ·   Cards: {len(cards)}", False),
        (f"Source: {d.get('source', '')}", False),
        ("", False),
        ("How to study a card", True),
        ("1. Read Side 1 only. Try to say the meaning, answer or formula out loud before looking further.", False),
        ("2. Check yourself against Side 2. Read the examples and the common mistake.", False),
        ("3. Do the practice on Side 3 without looking back. Then mark Status: New → Learning → Known.", False),
        (f"4. Review on days {', '.join(map(str, REVIEW_DAYS))} after first study: write the date or ✓ in that day's column.", False),
        ("   Got it wrong on a review? Start that card's days again from Day 1.", False),
        ("5. Follow 'Study order': prerequisites come first, then easy to hard.", False),
        ("", False),
        ("Colours", True),
        ("Shaded cells were added by Claude, not taken from your own book or notes. Check them against a trusted source,", False),
        ("and mark the card 'Fix' in the OK / Fix column if anything is wrong. Unshaded cells came from your source.", False),
    ]
    for i, (text, bold) in enumerate(rows, 1):
        c = ws.cell(i, 1, text)
        c.font = Font(bold=bold, size=14 if i == 1 else 11)
        if text.startswith("Shaded"):
            c.fill = ADDED
    ws.column_dimensions["A"].width = 120


def summary(ws, deck, cards):
    errors, warnings = audit(deck)
    r = 1

    def block(title, counter):
        nonlocal r
        ws.cell(r, 1, title).font = Font(bold=True)
        r += 1
        for k, n in sorted(counter.items(), key=lambda x: (-x[1], str(x[0]))):
            ws.cell(r, 1, str(k))
            ws.cell(r, 2, n)
            r += 1
        r += 1

    block("Cards by type", Counter(TYPES[c["type"]]["label"] for c in cards if c.get("type") in TYPES))
    block("Cards by topic", Counter(c.get("topic", "") for c in cards))
    block("Cards by level", Counter(c.get("level", "") for c in cards))
    block("Cards by source", Counter("Claude knowledge" if is_claude(c) else "Your source" for c in cards))
    ws.cell(r, 1, "Error check").font = Font(bold=True)
    r += 1
    ws.cell(r, 1, f"{len(errors)} errors, {len(warnings)} warnings")
    r += 1
    for m in errors + warnings:
        ws.cell(r, 1, m)
        r += 1
    ws.column_dimensions["A"].width = 90
    ws.column_dimensions["B"].width = 10


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    deck = json.load(open(sys.argv[1], encoding="utf-8"))
    cards = deck.get("cards", [])
    wb = Workbook()
    read_me(wb.active, deck, cards)
    wb.active.title = "Read Me"
    for key in TYPES:
        group = [c for c in cards if c.get("type") == key]
        if group:
            card_sheet(wb, key, group)
            sheet = re.sub(r"[/\\?*\[\]:]", "-", f"{TYPES[key]['label']} cards")[:31]
            if TYPES[key].get("view"):
                card_view(wb, key, group, sheet)
    na, nq = anki_sheets(wb, cards, sys.argv[2])
    summary(wb.create_sheet("Summary"), deck, cards)
    wb.save(sys.argv[2])
    print(f"Wrote {sys.argv[2]}: {len(cards)} cards, {na} Anki cards, {nq} Anki quiz cards (+ .tsv files for Anki import)")


if __name__ == "__main__":
    main()

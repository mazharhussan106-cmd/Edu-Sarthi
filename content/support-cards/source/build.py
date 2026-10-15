"""Build the support-card workbook and JSON.
Usage: python3 build.py out.xlsx out.json

Sheets: Read Me · Card View (pick an ID, see the three sides; formulas) ·
Voice · Chat · Email (56 fields + review columns the learner fills in) ·
Field guide · Summary (formulas over the card sheets + the audit result) ·
Sources (research links) · Lists (dropdown values)."""
import datetime, glob, json, re, sys
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill, Border, Side
from openpyxl.utils import get_column_letter as L
from openpyxl.worksheet.datavalidation import DataValidation
from schema import FIELDS, KEYS
from audit import parse, audit

HERE = __file__.rsplit("/", 1)[0]
F = "Arial"
NAVY = "1F3A68"
BAND = {"Card": "5F6773", "Side 1": "0077B3", "Side 2": "B35500", "Side 3": "1A7F45", "Review": "8F6300"}
SIDE_TITLE = {"Card": "CARD", "Side 1": "SIDE 1 · RECOGNITION", "Side 2": "SIDE 2 · MEANING & USE", "Side 3": "SIDE 3 · PRACTICE", "Review": "MY REVIEW (fill in)"}
INPUT_FILL = PatternFill("solid", fgColor="FFF4CC")
thin = Side(style="thin", color="D0D0D0")
REVIEW = ["Status", "Day 1", "Day 3", "Day 7", "Day 15", "Day 30", "Day 60", "My remark"]
CHANNELS = ("Voice", "Chat", "Email")
FIRST = 3  # first data row on the card sheets

cards, order = parse(sorted(glob.glob(f"{HERE}/cards_*.txt")))
errors, warnings = audit(cards, order)
# Study order: Voice → Chat → Email, Basic → Intermediate → Advanced, then card number.
order = sorted(order, key=lambda i: ("VCE".index(i[2]), "BIA".index(i[4]), int(i[-3:])))
rows = [cards[i] for i in order]


def font(**kw):
    return Font(name=F, **kw)


def head(cell, text, fill):
    cell.value = text
    cell.font = font(bold=True, color="FFFFFF")
    cell.fill = PatternFill("solid", fgColor=fill)
    cell.alignment = Alignment(wrap_text=True, vertical="center")


wb = Workbook()

# ---------------------------------------------------------------- Read Me
ws = wb.active
ws.title = "Read Me"
readme = [
    ("EduSarthi — Customer Support English cards", "title"),
    ("180 cards: Voice, Chat and Email × Basic, Intermediate, Advanced × 20 cards. In every group of 20: 14 'Say it' cards (what the agent says or writes) and 6 'Understand it' cards (what the customer says, what it means, and what to say next).", ""),
    ("Every card has the same 56 fields on three sides, like every EduSarthi card: Side 1 Recognition · Side 2 Meaning & use · Side 3 Practice. The 'Field guide' sheet explains each field.", ""),
    ("How to study", "h"),
    ("1. Open 'Card View' and pick a card ID in the yellow cell (B3).  2. Read Side 1 and answer 'Recall first' before you look further.  3. Read Side 2.  4. Do every task on Side 3 out loud or in writing.  5. Voice and chat cards: record yourself. Email cards: write the reply and send it as text or a photo for audit.  6. In the card's sheet (Voice, Chat or Email), fill in your review columns.  7. Review again on days 1 · 3 · 7 · 15 · 30 · 60.", ""),
    ("Cells you fill in", "h"),
    ("Only the yellow cells: Card View B3 (the card ID) and the 'MY REVIEW' columns at the right of the Voice, Chat and Email sheets — Status (pick Known / Unknown / Learning / Fix), Day 1 … Day 60 (the date you reviewed), My remark. Example: Status = Learning · Day 1 = 14 Oct · Day 3 = 17 Oct · My remark = 'I keep saying \"one minute\" instead of a real time'. The 'Summary' sheet counts your Known cards automatically.", ""),
    ("Placeholders", "h"),
    ("[Company] stands for the company name. Names, order numbers, amounts and dates in the examples are made up.", ""),
    ("Status: DRAFT", "h"),
    ("Every line was written by Claude from public customer-service guidance (see 'Sources') and checked twice (a script plus two rounds of independent review). It still needs a check by a verified teacher before students use it. Indian-English phrases such as 'revert' or 'prepone' are taught as switches for international customers, not as mistakes.", ""),
]
for r, (t, kind) in enumerate(readme, 1):
    c = ws.cell(row=r, column=1, value=t)
    c.font = font(bold=kind in ("title", "h"), size=15 if kind == "title" else 11, color=NAVY if kind else "1B1F24")
    c.alignment = Alignment(wrap_text=True, vertical="top")
ws.column_dimensions["A"].width = 125

# ---------------------------------------------------------------- Lists (dropdown values)
lists = wb.create_sheet("Lists")
lists["A1"] = "Card IDs"; lists["B1"] = "Status options"
for i, cid in enumerate(order, 2):
    lists.cell(row=i, column=1, value=cid)
for i, s in enumerate(["Known", "Unknown", "Learning", "Fix"], 2):
    lists.cell(row=i, column=2, value=s)
for row in lists.iter_rows():
    for c in row: c.font = font(bold=c.row == 1)
lists.column_dimensions["A"].width = 14; lists.column_dimensions["B"].width = 16
lists.sheet_state = "hidden"

# ---------------------------------------------------------------- Voice / Chat / Email
groups = [("Card", [f for f in FIELDS if f[1] == "Card"]), ("Side 1", [f for f in FIELDS if f[1] == "Side 1"]),
          ("Side 2", [f for f in FIELDS if f[1] == "Side 2"]), ("Side 3", [f for f in FIELDS if f[1] == "Side 3"])]
REV0 = len(KEYS) + 1  # first review column
last_row = {}
for ch in CHANNELS:
    sh = wb.create_sheet(ch)
    col = 1
    for side, fs in groups + [("Review", REVIEW)]:
        n = len(fs)
        sh.merge_cells(start_row=1, start_column=col, end_row=1, end_column=col + n - 1)
        head(sh.cell(row=1, column=col), SIDE_TITLE[side], BAND[side])
        sh.cell(row=1, column=col).alignment = Alignment(horizontal="center")
        col += n
    for j, (k, side, label, hint, _) in enumerate(FIELDS, 1):
        head(sh.cell(row=2, column=j), label, NAVY)
        narrow = side == "Card" or k in ("register", "importance", "mcq_answer", "speaker", "fill_answer")
        sh.column_dimensions[L(j)].width = 13 if narrow else 34
    for j, label in enumerate(REVIEW, REV0):
        head(sh.cell(row=2, column=j), label, BAND["Review"])
        sh.column_dimensions[L(j)].width = 13 if label != "My remark" else 30
    r = FIRST
    for c_ in rows:
        if c_.get("channel") != ch:
            continue
        for j, k in enumerate(KEYS, 1):
            cell = sh.cell(row=r, column=j, value=c_.get(k, ""))
            cell.alignment = Alignment(wrap_text=True, vertical="top")
            cell.border = Border(bottom=thin)
            cell.font = font(bold=k == "sentence", color=NAVY if k == "sentence" else "1B1F24")
        for j in range(REV0, REV0 + len(REVIEW)):
            cell = sh.cell(row=r, column=j)
            cell.fill = INPUT_FILL; cell.border = Border(bottom=thin); cell.font = font()
            cell.alignment = Alignment(wrap_text=True, vertical="top")
        r += 1
    last_row[ch] = r - 1
    dv = DataValidation(type="list", formula1="=Lists!$B$2:$B$5", allow_blank=True,
                        errorTitle="Pick a status", error="Choose Known, Unknown, Learning or Fix.")
    sh.add_data_validation(dv)
    dv.add(f"{L(REV0)}{FIRST}:{L(REV0)}{last_row[ch]}")
    sh.freeze_panes = "H3"  # ID … sentence stay visible
    sh.auto_filter.ref = f"A2:{L(REV0 + len(REVIEW) - 1)}{last_row[ch]}"
    sh.row_dimensions[2].height = 34

# ---------------------------------------------------------------- Card View
cv = wb.create_sheet("Card View", 1)
cv["A1"] = "Card View — pick a card ID in the yellow cell"
cv["A1"].font = font(bold=True, size=14, color=NAVY)
cv["A3"] = "Card ID"; cv["A3"].font = font(bold=True)
cv["B3"] = order[0]
cv["B3"].fill = INPUT_FILL; cv["B3"].font = font(bold=True, size=12)
dv = DataValidation(type="list", formula1=f"=Lists!$A$2:$A${len(order) + 1}", allow_blank=False,
                    errorTitle="Unknown card ID", error="Pick an ID from the list, e.g. CSV-B-006.")
cv.add_data_validation(dv); dv.add("B3")


def lookup(colletter):
    parts = [f"INDEX({ch}!${colletter}:${colletter},MATCH($B$3,{ch}!$A:$A,0))" for ch in CHANNELS]
    return f'=IFERROR({parts[0]},IFERROR({parts[1]},IFERROR({parts[2]},"")))'


r = 5
for side, fs in groups:
    cv.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2)
    head(cv.cell(row=r, column=1), SIDE_TITLE[side], BAND[side])
    r += 1
    for (k, s, label, hint, _) in fs:
        j = KEYS.index(k) + 1
        a = cv.cell(row=r, column=1, value=label); a.font = font(bold=True, color=BAND[side])
        a.alignment = Alignment(vertical="top", wrap_text=True)
        b = cv.cell(row=r, column=2, value=lookup(L(j)))
        b.alignment = Alignment(wrap_text=True, vertical="top")
        b.font = font(bold=k == "sentence", size=13 if k == "sentence" else 11, color=NAVY if k == "sentence" else "1B1F24")
        b.border = Border(bottom=thin)
        r += 1
    r += 1
cv.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2)
head(cv.cell(row=r, column=1), "MY REVIEW (fill it in on the Voice / Chat / Email sheet)", BAND["Review"])
r += 1
for i, label in enumerate(REVIEW):
    cv.cell(row=r, column=1, value=label).font = font(bold=True, color=BAND["Review"])
    col = L(REV0 + i)
    # A blank review cell must show blank, not 0, and a typed date must stay a date.
    parts = [f'IF(INDEX({ch}!${col}:${col},MATCH($B$3,{ch}!$A:$A,0))="","",INDEX({ch}!${col}:${col},MATCH($B$3,{ch}!$A:$A,0)))' for ch in CHANNELS]
    b = cv.cell(row=r, column=2, value=f'=IFERROR({parts[0]},IFERROR({parts[1]},IFERROR({parts[2]},"")))')
    b.alignment = Alignment(wrap_text=True, vertical="top", horizontal="left"); b.font = font()
    if label.startswith("Day"):
        b.number_format = "d mmm yyyy"
    r += 1
cv.column_dimensions["A"].width = 30
cv.column_dimensions["B"].width = 110
cv.freeze_panes = "A5"

# ---------------------------------------------------------------- Field guide
fg = wb.create_sheet("Field guide")
for j, h in enumerate(["#", "Side", "Field", "Key", "What goes in it"], 1):
    head(fg.cell(row=1, column=j), h, NAVY)
for i, (k, side, label, hint, _) in enumerate(FIELDS, 1):
    for j, v in enumerate([i, side, label, k, hint], 1):
        c = fg.cell(row=i + 1, column=j, value=v)
        c.alignment = Alignment(wrap_text=True, vertical="top"); c.font = font()
for j, wdt in enumerate([5, 9, 28, 24, 95], 1):
    fg.column_dimensions[L(j)].width = wdt

# ---------------------------------------------------------------- Summary (formulas)
sm = wb.create_sheet("Summary")
sm["A1"] = "Summary"; sm["A1"].font = font(bold=True, size=14, color=NAVY)
r = 3
for h, j in (("Count", 1), ("Voice", 2), ("Chat", 3), ("Email", 4), ("All", 5)):
    head(sm.cell(row=r, column=j), h, NAVY)
col_of = {k: L(KEYS.index(k) + 1) for k in ("level", "kind", "call_stage", "cefr")}
STATUS = L(REV0)


def countif(ch, col, val):
    return f'COUNTIF({ch}!${col}${FIRST}:${col}$500,"{val}")'


lines = [("Cards", None, None)]
lines += [(f"Level: {v}", "level", v) for v in ("Basic", "Intermediate", "Advanced")]
lines += [(f"Kind: {v}", "kind", v) for v in ("Say it", "Understand it")]
stages = sorted({c_["call_stage"] for c_ in rows})
lines += [(f"Stage: {v}", "call_stage", v) for v in stages]
lines += [(f"CEFR: {v}", "cefr", v) for v in ("A2", "B1", "B2", "C1")]
lines += [(f"My status: {v}", "status", v) for v in ("Known", "Learning", "Unknown", "Fix")]
r += 1
for label, key, val in lines:
    sm.cell(row=r, column=1, value=label).font = font(bold=label == "Cards")
    for j, ch in enumerate(CHANNELS, 2):
        if key is None:
            f = f"=COUNTA({ch}!$A${FIRST}:$A$500)"
        else:
            f = "=" + countif(ch, STATUS if key == "status" else col_of[key], val)
        sm.cell(row=r, column=j, value=f).font = font()
    sm.cell(row=r, column=5, value=f"=SUM(B{r}:D{r})").font = font(bold=True)
    r += 1
r += 1
stamp = datetime.date.today().isoformat()
sm.cell(row=r, column=1, value=f"Audit script result ({stamp}, run when this file was built)").font = font(bold=True, color=NAVY)
r += 1
sm.cell(row=r, column=1, value="Errors").font = font(); sm.cell(row=r, column=2, value=len(errors)).font = font(); r += 1
sm.cell(row=r, column=1, value="Warnings").font = font(); sm.cell(row=r, column=2, value=len(warnings)).font = font(); r += 1
for x in errors + warnings:
    sm.cell(row=r, column=1, value=x).font = font(); r += 1
sm.column_dimensions["A"].width = 46
for j in "BCDE":
    sm.column_dimensions[j].width = 12

# ---------------------------------------------------------------- Sources
src = wb.create_sheet("Sources")
head(src.cell(row=1, column=1), "Source", NAVY); head(src.cell(row=1, column=2), "Link", NAVY)
links = []
try:
    for line in open(f"{HERE}/research.md", encoding="utf-8"):
        for title, url in re.findall(r"\[([^\]]+)\]\((https?://[^)\s]+)\)", line):
            if url not in [u for _, u in links]:
                links.append((title, url))
except FileNotFoundError:
    pass
for i, (t, u) in enumerate(links, 2):
    src.cell(row=i, column=1, value=t).font = font()
    c = src.cell(row=i, column=2, value=u); c.font = font(color="0563C1", underline="single"); c.hyperlink = u
src.column_dimensions["A"].width = 60; src.column_dimensions["B"].width = 100

wb.move_sheet("Lists", offset=len(wb.sheetnames))
wb.save(sys.argv[1])
json.dump([{k: c_.get(k, "") for k in KEYS} for c_ in rows], open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"Wrote {sys.argv[1]} and {sys.argv[2]}: {len(rows)} cards, {len(errors)} audit errors, {len(warnings)} warnings, {len(links)} sources")

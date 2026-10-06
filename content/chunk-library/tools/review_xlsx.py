# Owns building the two review workbooks a teacher checks before cards go live:
# Chunk_Library_Review.xlsx (from chunks.json) and Grammar_Library_Review.xlsx
# (from grammar.json). One row per card, Claude's drafts shaded, OK/Fix and
# comment columns for the reviewer.
#
# It deliberately does NOT feed the app; the app reads the JSON files, which
# export_json.py builds from the workbook and tools/rich/.
#
# Run from the repo root:  python content/chunk-library/tools/review_xlsx.py
import json
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

TYPE = {"frames":"Frames","prepositions":"Prepositions","collocations":"Collocations","utterances":"Utterances","polywords":"Polywords","grammar":"Grammar"}

def j(x, sep=" / "): return sep.join(x) if x else ""
def g(c,*ks):
    v=c
    for k in ks:
        v = (v or {}).get(k) if isinstance(v,dict) else None
    return v or ""

# (group, header, getter, drafted?)  drafted: True = Claude wrote it; "k" = drafted only if key in c["drafted"]
COLS = [
 ("Pehchaan","Order",lambda c:c["order_a"],False),
 ("Pehchaan","ID",lambda c:c["code"],False),
 ("Pehchaan","Chunk",lambda c:c["text"],False),
 ("Pehchaan","Type",lambda c:TYPE[c["type"]],False),
 ("Pehchaan","Pehle Core 220?",lambda c:"Haan" if c["was_core"] else "",False),
 ("Pehchaan","Level",lambda c:c["level"],False),
 ("Pehchaan","Group",lambda c:g(c,"group"),False),
 ("Pehchaan","Lewis type",lambda c:g(c,"lewis_type"),False),
 ("Side 1 · Awaaz","IPA",lambda c:g(c,"ipa"),True),
 ("Side 1 · Awaaz","Linking",lambda c:g(c,"linking"),True),
 ("Side 1 · Awaaz","Indian pronunciation",lambda c:g(c,"hi_pron"),True),
 ("Side 1 · Awaaz","Stress",lambda c:g(c,"stress"),True),
 ("Side 1 · Awaaz","Register",lambda c:g(c,"register"),True),
 ("Side 1 · Awaaz","Kab bolein",lambda c:g(c,"when"),"when"),
 ("Side 1 · Awaaz","Kab nahi bolna",lambda c:g(c,"not_when"),True),
 ("Side 1 · Awaaz","Pronunciation tip",lambda c:g(c,"pron_tip"),True),
 ("Side 1 · Awaaz","Memory trick",lambda c:g(c,"memory"),True),
 ("Side 2 · Matlab","Hindi (Devanagari)",lambda c:g(c,"hindi","dev"),"hindi_devanagari"),
 ("Side 2 · Matlab","Hindi (Roman)",lambda c:g(c,"hindi","roman"),"hindi"),
 ("Side 2 · Matlab","Simple English",lambda c:g(c,"simple"),True),
 ("Side 2 · Matlab","Example 1",lambda c:g(c,"example"),"example"),
 ("Side 2 · Matlab","Example 2",lambda c:(c.get("more_examples") or ["",""])[0] if c.get("more_examples") else "",True),
 ("Side 2 · Matlab","Example 3",lambda c:c["more_examples"][1] if len(c.get("more_examples") or [])>1 else "",True),
 ("Side 2 · Matlab","Hindi example (Roman)",lambda c:g(c,"hindi_example","roman"),"hindi_example"),
 ("Side 2 · Galti","Galat ✗",lambda c:g(c,"watch_out","wrong"),"watch_out"),
 ("Side 2 · Galti","Sahi ✓",lambda c:g(c,"watch_out","right"),"watch_out"),
 ("Side 2 · Galti","Kyon / Tip",lambda c:g(c,"watch_out","why") or g(c,"watch_out","tip"),"watch_out"),
 ("Side 2 · Dhancha","Grammar pattern",lambda c:g(c,"pattern"),True),
 ("Side 2 · Dhancha","Doosre roop",lambda c:g(c,"forms"),True),
 ("Side 2 · Dhancha","Slot",lambda c:g(c,"slot"),False),
 ("Side 2 · Tulna","Milte-julte",lambda c:g(c,"similar"),True),
 ("Side 2 · Tulna","Ye na bolein",lambda c:g(c,"dont_say"),True),
 ("Side 2 · Tulna","Jawab jo milega",lambda c:g(c,"reply"),True),
 ("Side 2 · Tulna","Galat jawab (MCQ)",lambda c:j(c.get("reply_wrong")),True),
 ("Side 2 · Tulna","Confusing jodi",lambda c:g(c,"confusing","pair"),True),
 ("Side 2 · Tulna","Fark",lambda c:g(c,"confusing","diff"),True),
 ("Side 2 · Tulna","Kahan bola jaata hai",lambda c:j(c.get("where"),", "),True),
 ("Side 2 · Tulna","Tone",lambda c:g(c,"tone"),True),
 ("Side 3 · Real life","Everyday",lambda c:g(c,"real_life","everyday"),True),
 ("Side 3 · Real life","Kaam / Office",lambda c:g(c,"real_life","work"),True),
 ("Side 3 · Real life","Casual",lambda c:g(c,"real_life","casual"),True),
 ("Side 3 · Real life","Mini conversation",lambda c:"\n".join(c.get("conversation") or []),True),
 ("Side 3 · Practice","Speaking task (audit)",lambda c:g(c,"speaking_task"),True),
 ("Side 3 · Practice","Gap-fill (sheet)",lambda c:(g(c,"gap","q")+" → "+g(c,"gap","a")) if c.get("gap") else "",False),
 ("Teacher check","Theek hai? (OK / Fix)",lambda c:"",None),
 ("Teacher check","Kya badalna hai",lambda c:"",None),
]
GROUP_FILL = {"Pehchaan":"1F3A68","Side 1 · Awaaz":"0077B3","Side 2 · Matlab":"B35500","Side 2 · Galti":"C73A3A","Side 2 · Dhancha":"0F7F74","Side 2 · Tulna":"1A7F45","Side 3 · Real life":"8F6300","Side 3 · Practice":"6A3D9A","Teacher check":"333333"}
DRAFT = PatternFill("solid", fgColor="FFF4D6")
thin = Side(style="thin", color="D0D0D0")

def build(d, out, title, where):
    wb = Workbook()
    rm = wb.active; rm.title = "Read Me"
    lines = [
     (f"{title} · poora card data (check ke liye)", True),
     ("", False),
     (f"Is file mein {len(d):,} cards hain ({where}). Har row ek card hai, aur har column card ka ek hissa.", False),
     ("Peeli (halki) cell = Claude ka draft, abhi teacher ne check nahi kiya. Safed cell = aapki Excel file se aaya.", False),
     ("Column ke upar rangeen patti batati hai ki hissa card ke kis side par dikhega.", False),
     ("Aakhri do column aapke liye hain: 'OK' ya 'Fix' chunein, aur jo badalna hai woh likhein.", False),
     ("", False),
     ("Core 220 ab alag type nahi hai: har chunk apni Lewis type mein hai. 'Pehle Core 220?' column mein 'Haan' likha hai.", False),
     ("Order = student ko chunk kis kram mein milega (A1 → A2 → B1, purane Core pehle).", False),
     ("", False),
     ("Tips: Data sheet mein filter laga hai. Type, Level ya 'Pehle Core 220?' se filter karke thoda-thoda check karein.", False),
     ("Ye file sirf check ke liye hai. App is file se nahi, tools/rich/*.txt aur Chunk_Library_Master.xlsx se data leta hai.", False),
     ("Jo 'Fix' mark karenge, woh mujhe bhejein; main drafts theek karke dobara bana dunga.", False),
    ]
    for i,(t,b) in enumerate(lines,1):
        c=rm.cell(row=i,column=1,value=t); c.font=Font(bold=b, size=14 if b else 11)
    rm.column_dimensions["A"].width=120

    ws = wb.create_sheet("Chunks")
    # group row
    col=1
    prev=None; start=1
    for i,(grp,h,_,_) in enumerate(COLS,1):
        ws.cell(row=2,column=i,value=h)
    for i,(grp,_,_,_) in enumerate(COLS+[(None,None,None,None)],1):
        if grp!=prev:
            if prev is not None:
                ws.cell(row=1,column=start,value=prev)
                if i-1>start: ws.merge_cells(start_row=1,start_column=start,end_row=1,end_column=i-1)
                for k in range(start,i):
                    ws.cell(row=1,column=k).fill=PatternFill("solid",fgColor=GROUP_FILL[prev])
            prev=grp; start=i
    for i in range(1,len(COLS)+1):
        c1=ws.cell(row=1,column=i); c1.font=Font(bold=True,color="FFFFFF"); c1.alignment=Alignment(horizontal="center")
        c2=ws.cell(row=2,column=i); c2.font=Font(bold=True); c2.fill=PatternFill("solid",fgColor="EEF2F7")
        c2.alignment=Alignment(wrap_text=True,vertical="center"); c2.border=Border(bottom=Side(style="medium"))
    WIDTH = {"Order":7,"ID":11,"Level":6,"Pehle Core 220?":9,"Type":13,"Register":10,"Tone":14,"Theek hai? (OK / Fix)":12}
    for i,(_,h,_,_) in enumerate(COLS,1):
        ws.column_dimensions[get_column_letter(i)].width = WIDTH.get(h, 30 if h not in ("IPA","Stress","Linking") else 26)

    for r,c in enumerate(sorted(d,key=lambda x:x["order_a"]),3):
        dr=set(c.get("drafted") or [])
        for i,(_,h,f,dflag) in enumerate(COLS,1):
            v=f(c)
            cell=ws.cell(row=r,column=i,value=v)
            cell.alignment=Alignment(wrap_text=True,vertical="top")
            cell.border=Border(bottom=thin)
            is_draft = dflag is True or (isinstance(dflag,str) and dflag in dr)
            if is_draft and v: cell.fill=DRAFT
        ws.row_dimensions[r].height=60
    ws.freeze_panes="D3"
    ws.auto_filter.ref=f"A2:{get_column_letter(len(COLS))}{len(d)+2}"
    dv=DataValidation(type="list",formula1='"OK,Fix"',allow_blank=True)
    ws.add_data_validation(dv)
    dv.add(f"{get_column_letter(len(COLS)-1)}3:{get_column_letter(len(COLS)-1)}{len(d)+2}")

    # summary
    sm = wb.create_sheet("Summary")
    sm.append(["Type","Chunks","Pehle Core 220 se"])
    for t,lab in TYPE.items():
        if not any(c["type"]==t for c in d): continue
        sm.append([lab, sum(1 for c in d if c["type"]==t), sum(1 for c in d if c["type"]==t and c["was_core"])])
    sm.append(["Kul", len(d), sum(1 for c in d if c["was_core"])])
    sm.append([])
    sm.append(["Level","Chunks"])
    for lv in ["A1","A2","B1"]: sm.append([lv, sum(1 for c in d if c["level"]==lv)])
    for row in sm.iter_rows():
        for c in row:
            if c.row in (1,8): c.font=Font(bold=True)
    sm.column_dimensions["A"].width=18; sm.column_dimensions["B"].width=10; sm.column_dimensions["C"].width=20

    wb.save(out); print(out, len(d), len(COLS))


if __name__ == "__main__":
    base = "content/chunk-library/"
    build(json.load(open(base + "chunks.json")), base + "Chunk_Library_Review.xlsx", "Chunk Library", "Flashcard → Chunk tab")
    build(json.load(open(base + "grammar.json")), base + "Grammar_Library_Review.xlsx", "Grammar Library", "Flashcard → Grammar tab")

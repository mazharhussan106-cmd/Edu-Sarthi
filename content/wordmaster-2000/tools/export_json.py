"""Exports WordMaster2000_FINAL.xlsx to words.json for the app's importer.

Reads the 'Words 1–2000' and 'Extra 2001–2227' sheets (inline strings, no
shared-strings table), keys every row by a snake_case version of the header,
and writes one JSON array. Standard library only, so it runs anywhere Python
does.

Run from the repo root:  python content/wordmaster-2000/tools/export_json.py
"""
import json, re, zipfile, html, os

SRC = "content/wordmaster-2000/WordMaster2000_FINAL.xlsx"
OUT = "content/wordmaster-2000/words.json"
SHEETS = ["Words 1–2000", "Extra 2001–2227"]

def key(h):
    h = re.sub(r"\(.*?\)|★NEW|❌|✅", "", h)
    h = h.replace("→", " to ").replace("&", " and ")
    return re.sub(r"[^a-z0-9]+", "_", h.lower()).strip("_")

def cells(row_xml):
    out = {}
    for ref, body in re.findall(r'<c r="([A-Z]+)\d+"[^>]*?(?:/>|>(.*?)</c>)', row_xml, re.S):
        texts = re.findall(r"<t[^>]*>(.*?)</t>", body or "", re.S)
        val = "".join(texts) if texts else (re.findall(r"<v>(.*?)</v>", body or "") or [""])[0]
        out[ref] = html.unescape(val).strip()
    return out

z = zipfile.ZipFile(SRC)
wb = z.read("xl/workbook.xml").decode()
names = re.findall(r'<sheet name="([^"]+)"[^>]*r:id="([^"]+)"', wb)
# Attribute order varies between Excel writers, so each tag is read on its own.
rels = {}
for tag in re.findall(r"<Relationship [^>]*>", z.read("xl/_rels/workbook.xml.rels").decode()):
    rels[re.search(r'Id="([^"]+)"', tag).group(1)] = re.search(r'Target="([^"]+)"', tag).group(1)

words = []
for name, rid in names:
    if name not in SHEETS:
        continue
    xml = z.read("xl/" + rels[rid].lstrip("/").replace("xl/", "")).decode()
    rows = re.findall(r"<row [^>]*>.*?</row>", xml, re.S)
    header = cells(rows[1])  # row 1 is the group band, row 2 the real header
    cols = {c: key(h) for c, h in header.items() if h}
    for r in rows[2:]:
        c = cells(r)
        rec = {cols[k]: v for k, v in c.items() if k in cols and v and v != "—"}
        if rec.get("word_id") and rec.get("word"):
            words.append(rec)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(words, f, ensure_ascii=False, separators=(",", ":"))
print(len(words), "words;", len(set(k for w in words for k in w)), "distinct fields")

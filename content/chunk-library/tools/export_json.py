# Owns turning Chunk_Library_Master.xlsx into chunks.json, the file the
# database importer (prisma/import-chunks.ts) reads.
#
# It merges three sources, in this order of trust:
#   1. the owner's workbook ("All Chunks" sheet) — always wins where it has a value
#   2. core_drafts.py  — Claude's drafts for the Core 220 gaps (marked "draft")
#   3. dev_*.txt       — Claude's Devanagari for the workbook's Roman Hindi (marked "draft")
#
# It deliberately does NOT invent practice questions. Gap-fill, multiple
# choice and translation are assembled in the app from these fields.
#
# Run from the repo root:  python content/chunk-library/tools/export_json.py
# Needs: pip install openpyxl

from __future__ import annotations

import glob
import json
import os
import re
import sys
from collections import defaultdict

import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import core_drafts  # noqa: E402

# The word list already owns PRP-001…077, and codes must be unique across all
# cards, so Preposition Frames are renamed on import. The workbook keeps PRP.
PREFIX_MAP = {"PRP": "PFR"}

SHEET_KEY = {
    "Core 220": "core",
    "Sentence Frames": "frames",
    "Preposition Frames": "prepositions",
    "Collocations": "collocations",
    "Utterances": "utterances",
    "Polywords": "polywords",
}
LEVELS = ["A1", "A2", "B1"]
# Round-robin order for the non-core chunks inside each level, so a student
# meets a mix of types rather than 300 frames in a row.
MIX = ["frames", "collocations", "utterances", "polywords", "prepositions"]


def app_code(sheet_id: str) -> str:
    prefix, num = sheet_id.split("-", 1)
    return f"{PREFIX_MAP.get(prefix, prefix)}-{num}"


def clean(v) -> str | None:
    if v is None:
        return None
    s = str(v).strip()
    return s or None


def load_devanagari() -> dict[str, tuple[str, str]]:
    out: dict[str, tuple[str, str]] = {}
    for path in sorted(glob.glob(os.path.join(HERE, "dev_*.txt"))):
        for n, line in enumerate(open(path, encoding="utf-8"), 1):
            line = line.strip()
            if not line:
                continue
            parts = [p.strip() for p in line.split(" | ")]
            if len(parts) != 3:
                raise ValueError(f"{os.path.basename(path)}:{n}: expected 3 fields")
            out[parts[0]] = (parts[1], parts[2])
    return out


def watch(raw: str | None) -> dict | None:
    """Split the watch-out cell into a wrong version (shown with ✗) or a tip.

    The sheet mixes three shapes: a bare wrong phrase ("do noise"), a
    'Not "…"' sentence, and advice ("Means: …", "since + point in time…").
    Only the first two are safe to show as a crossed-out example.
    """
    if not raw:
        return None
    m = re.match(r'^Not "([^"]+)"(?:[:;,]?\s*(.*))?$', raw)
    if m:
        return {"wrong": m.group(1), "why": clean(m.group(2)), "tip": None}
    if not re.search(r"[:=;]|^(Don't|Never|Means|Use|Here|Keep)\b", raw) and len(raw.split()) <= 6:
        return {"wrong": raw, "why": None, "tip": None}
    return {"wrong": None, "why": None, "tip": raw}


def main() -> None:
    wb = openpyxl.load_workbook(os.path.join(ROOT, "Chunk_Library_Master.xlsx"), data_only=True)
    ws = wb["All Chunks"]
    rows = list(ws.iter_rows(values_only=True))
    head = rows[0]
    data = [dict(zip(head, r)) for r in rows[1:] if any(r)]

    drafts = core_drafts.load()
    dev = load_devanagari()
    ids = {d["ID"] for d in data}

    chunks = []
    for d in data:
        sid = d["ID"]
        sheet = SHEET_KEY[d["Sheet"]]
        drafted: list[str] = []
        dr = drafts.get(sid, {})

        hi_rom = clean(d["Hindi"])
        hiex_rom = clean(d["Hindi example"])
        hi_dev = hiex_dev = None
        if sid in dev:
            hi_dev, hiex_dev = dev[sid]
            drafted.append("hindi_devanagari")
        if not hi_rom and dr.get("hi_rom"):
            hi_rom, hi_dev = dr["hi_rom"], dr["hi_dev"]
            hiex_rom, hiex_dev = dr["hiex_rom"], dr["hiex_dev"]
            drafted += ["hindi", "hindi_example"]

        example = clean(d["English example"])
        when = None
        if dr.get("example"):
            example = dr["example"]
            drafted.append("example")
        if dr.get("when"):
            when = dr["when"]

        slot = clean(d["Slot"])
        if slot == "No slot":
            slot = None
        prep = clean(d["Preposition"])
        if prep == "(none)":
            prep = None
        related = clean(d["Related ID"])

        chunks.append(
            {
                "code": app_code(sid),
                "sheet_id": sid,
                "type": sheet,
                "lewis_type": clean(d["Lewis type"]),
                "group": clean(d["Group"]),
                "text": clean(d["English"]),
                "level": clean(d["Level"]),
                "topic": clean(d["Topic"]),
                "slot": slot,
                "when": when,
                "example": example,
                "hindi": {"dev": hi_dev, "roman": hi_rom} if hi_rom else None,
                "hindi_example": {"dev": hiex_dev, "roman": hiex_rom} if hiex_rom else None,
                "watch_out": watch(clean(d["Watch out / wrong version"])),
                "note": clean(d["Note"]),
                "gap": {"q": clean(d["Gap-fill question"]), "a": clean(d["Gap-fill answer"])} if d["Gap-fill question"] else None,
                "path_a": {"n": int(d["Path A #"]), "stage": clean(d["Path A stage"])} if d["Path A #"] else None,
                "path_b": {"n": int(d["Path B #"]), "stage": clean(d["Path B stage"])} if d["Path B #"] else None,
                "preposition": prep,
                "related": app_code(related) if related and related in ids else None,
                "phase": clean(d["Phase / Set"]),
                "merged_from": clean(d["Merged from"]),
                "drafted": drafted,
            }
        )

    # Two learning orders. Core first by its path number, then the rest by
    # level, types interleaved, each type in its own ID order.
    core = [c for c in chunks if c["type"] == "core"]
    rest = [c for c in chunks if c["type"] != "core"]
    tail: list[dict] = []
    for level in LEVELS:
        buckets = defaultdict(list)
        for c in rest:
            if c["level"] == level:
                buckets[c["type"]].append(c)
        for b in buckets.values():
            b.sort(key=lambda c: c["sheet_id"])
        while any(buckets.values()):
            for t in MIX:
                if buckets[t]:
                    tail.append(buckets[t].pop(0))
    for key, path in (("order_a", "path_a"), ("order_b", "path_b")):
        seq = sorted(core, key=lambda c: c[path]["n"]) + tail
        for i, c in enumerate(seq, 1):
            c[key] = i

    chunks.sort(key=lambda c: c["order_a"])
    out = os.path.join(ROOT, "chunks.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=1)

    # Coverage report: what the card will and will not have.
    n = len(chunks)
    def pct(k):  # noqa: E306
        return sum(1 for c in chunks if c.get(k))
    print(f"{n} chunks → {os.path.relpath(out)}")
    for k in ["hindi", "hindi_example", "example", "when", "watch_out", "note", "gap", "slot", "topic", "related"]:
        print(f"  {k:14s} {pct(k):5d}  ({100 * pct(k) // n}%)")
    print("  drafted:", sum(1 for c in chunks if c["drafted"]), "chunks have at least one Claude draft field")
    missing_dev = [c["code"] for c in chunks if c["hindi"] and not c["hindi"]["dev"]]
    print("  Hindi without Devanagari:", len(missing_dev), missing_dev[:5])
    assert len({c["code"] for c in chunks}) == n, "duplicate app codes"


if __name__ == "__main__":
    main()

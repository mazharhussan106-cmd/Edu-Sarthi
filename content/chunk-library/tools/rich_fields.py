# Owns reading Claude's drafts of the extra card fields (tools/rich/rich_*.txt,
# one chunk per line, " | " between fields) and merging them into a chunk.
#
# The workbook always wins: "when to use" and "watch out" come from the drafts
# only where the sheet's own cell is empty. Every drafted field is listed in
# the chunk's `drafted` array so the card can say it is not yet checked.
#
# It deliberately does NOT touch ordering, types or Hindi; export_json.py owns
# those.

from __future__ import annotations

import glob
import os

HERE = os.path.dirname(os.path.abspath(__file__))

# Cards whose workbook "Watch out / wrong version" cell holds a label ("Future
# plan", "Followed by \"to\"") rather than a wrong sentence. The card would show
# it as "✗ Future plan", so the drafted mistake is used and the label kept as
# the tip. Found by the review audit (1 Oct 2026).
SHEET_LABEL_NOT_MISTAKE = {"CORE-034", "CORE-055", "CORE-072", "CORE-106", "CORE-111", "CORE-138"}

FIELDS = [
    "code", "ipa", "linking", "hi_pron", "stress", "register", "when", "pron_tip",
    "not_when", "memory", "simple", "ex2", "ex3", "wrong", "right", "why",
    "pattern", "forms", "similar", "dont", "reply", "reply_wrong", "confusing",
    "diff", "where", "tone", "everyday", "work", "casual", "convo", "task",
]


def _val(s: str) -> str | None:
    s = s.strip()
    return None if s in ("", "-") else s


def _split(s: str | None, sep: str) -> list[str]:
    return [p.strip() for p in s.split(sep) if p.strip()] if s else []


def load() -> dict[str, dict[str, str | None]]:
    out: dict[str, dict[str, str | None]] = {}
    for path in sorted(glob.glob(os.path.join(HERE, "rich", "rich_*.txt"))):
        for n, line in enumerate(open(path, encoding="utf-8"), 1):
            line = line.rstrip("\n")
            if not line.strip() or line.startswith("#"):
                continue
            parts = line.split(" | ")
            if len(parts) != len(FIELDS):
                raise ValueError(f"{os.path.basename(path)}:{n}: expected {len(FIELDS)} fields, got {len(parts)}")
            row = {k: _val(v) for k, v in zip(FIELDS, parts)}
            if row["code"] in out:
                raise ValueError(f"{os.path.basename(path)}:{n}: duplicate {row['code']}")
            out[row["code"]] = row
    return out


def merge(chunk: dict, r: dict[str, str | None] | None) -> None:
    """Add the drafted fields to one chunk, in place."""
    if not r:
        return
    drafted = chunk["drafted"]

    if not chunk.get("when") and r["when"]:
        chunk["when"] = r["when"]
        drafted.append("when")
    label = None
    if chunk["code"] in SHEET_LABEL_NOT_MISTAKE and chunk.get("watch_out"):
        label = chunk["watch_out"].get("wrong")
        chunk["watch_out"] = None
    if not chunk.get("watch_out") and (r["wrong"] or r["right"]):
        chunk["watch_out"] = {"wrong": r["wrong"], "right": r["right"], "why": r["why"], "tip": label}
        drafted.append("watch_out")

    # The drafts sometimes repeat the workbook's own example as example 2 or
    # 3; a card showing the same sentence twice looks broken, so repeats go.
    seen = {(chunk.get("example") or "").strip().lower()}
    examples = []
    for e in (r["ex2"], r["ex3"]):
        if e and e.strip().lower() not in seen:
            seen.add(e.strip().lower())
            examples.append(e)
    chunk.update(
        {
            # Side 1 · sound
            "ipa": r["ipa"],
            "linking": r["linking"],
            "hi_pron": r["hi_pron"],
            "stress": r["stress"],
            "register": r["register"],
            "pron_tip": r["pron_tip"],
            "not_when": r["not_when"],
            "memory": r["memory"],
            # Side 2 · meaning and use
            "simple": r["simple"],
            "more_examples": examples,
            "pattern": r["pattern"],
            "forms": r["forms"],
            "similar": r["similar"],
            "dont_say": r["dont"],
            "reply": r["reply"],
            "reply_wrong": _split(r["reply_wrong"], " / "),
            "confusing": {"pair": r["confusing"], "diff": r["diff"]} if r["confusing"] else None,
            "where": _split(r["where"], ","),
            "tone": r["tone"],
            # Side 3 · real life and practice
            "real_life": {"everyday": r["everyday"], "work": r["work"], "casual": r["casual"]},
            "conversation": _split(r["convo"], " / "),
            "speaking_task": r["task"],
        }
    )
    drafted.append("card_fields")

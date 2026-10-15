"""Turn a plain-text deck (easy to write, no JSON escaping) into deck.json.

Usage:  python txt_to_deck.py cards.txt deck.json

Format (see references/example_deck.txt):

    deck.title: Python – Basics
    deck.subject: Python
    deck.learner: Self learner, Hinglish
    deck.source: Claude knowledge
    deck.language: python          <- 'python' turns on the code run-check
    type: code56                   <- default type for all cards below

    @PY-001                        <- one block per card, blank line between cards
    topic: 01 Basics
    level: Beginner                <- Basic / Core / Advanced, or Beginner / Intermediate / Advanced
    order: 1                       <- optional, defaults to position
    source: Claude knowledge       <- optional, defaults to deck.source
    added: memory_story, visual    <- optional, cells to shade as "check this"
    term: print() function
    code: print("hi")¶print("a", "b")
    explanation: A line that is long can
      continue on an indented line.

Rules: `key: value`. Use ¶ (or an indented continuation line) for a new line
inside a value. Lines starting with # are comments. `type:` inside a card
overrides the default type for that card.
"""
import json
import re
import sys

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from card_types import TYPES, COMMON  # noqa: E402

META = {"topic", "level", "order", "source", "added", "type", "id"}


def parse(text):
    deck, cards, cur, last = {}, [], None, None
    default_type = None
    for raw in text.split("\n"):
        if raw.startswith("#") or not raw.strip():
            if not raw.strip():
                last = None if cur is None else last
            continue
        if raw[:1] in (" ", "\t") and cur is not None and last:
            tgt = cur["fields"] if last in cur["fields"] else cur
            tgt[last] = str(tgt[last]) + "\n" + raw.strip()
            continue
        if raw.startswith("@"):
            cur = {"id": raw[1:].strip(), "fields": {}}
            cards.append(cur)
            last = None
            continue
        key, sep, val = raw.partition(":")
        key, val = key.strip(), val.strip().replace("¶", "\n")
        if not sep:
            raise SystemExit(f"Line not understood (needs 'key: value'): {raw!r}")
        if cur is None:
            if key.startswith("deck."):
                deck[key[5:]] = val
            elif key == "type":
                default_type = val
            else:
                raise SystemExit(f"Unknown header '{key}' before the first @card")
            continue
        last = key
        if key in META:
            if key == "added":
                cur["added"] = [x.strip() for x in val.split(",") if x.strip()]
            elif key == "order":
                cur["order"] = int(val)
            else:
                cur[key] = val
        else:
            cur["fields"][key] = val
    for i, c in enumerate(cards, 1):
        c.setdefault("type", default_type)
        c.setdefault("order", i)
        c.setdefault("source", deck.get("source", "Claude knowledge"))
        if c["type"] not in TYPES:
            raise SystemExit(f"{c['id']}: unknown type '{c['type']}'. Use one of: {', '.join(TYPES)}")
    return {"deck": deck, "cards": cards}


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    d = parse(open(sys.argv[1], encoding="utf-8").read())
    json.dump(d, open(sys.argv[2], "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print(f"Wrote {sys.argv[2]}: {len(d['cards'])} cards")


if __name__ == "__main__":
    main()

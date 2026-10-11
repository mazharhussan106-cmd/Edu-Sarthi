"""Print a blank card (text format) for a card type, with a hint per field.

Usage:  python scaffold.py code56 PY-001        (also: word56, topic56, concept, ...)

Paste the output into your cards.txt, fill it in, then run txt_to_deck.py.
"""
import sys

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from card_types import TYPES, SIDE_NAMES  # noqa: E402

if len(sys.argv) < 2 or sys.argv[1] not in TYPES:
    sys.exit(__doc__ + "\nTypes: " + ", ".join(TYPES))
t = TYPES[sys.argv[1]]
print(f"@{sys.argv[2] if len(sys.argv) > 2 else 'XXX-001'}\ntopic: \nlevel: \nsource: Claude knowledge")
for side in (1, 2, 3):
    print(f"# --- {SIDE_NAMES[side]} ---")
    for k, l, h in t["sides"][side]:
        req = " (required)" if k in t["required"] else ""
        print(f"# {l}{req}: {h}")
        print(f"{k}: ")

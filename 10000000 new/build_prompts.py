#!/usr/bin/env python3
"""
Turn every word's visualAssociation into a ready-to-paste Higgsfield prompt.

    python3 build_prompts.py app/src/main/assets/seed/words.json prompts.csv

Output columns: wordId, word, partOfSpeech, needsReview, prompt

`needsReview` flags the visual associations that describe text inside the
picture. The style brief forbids text in the artwork, so those scenes have to be
rewritten by hand before they are generated — otherwise the model paints words
into the drawing and the file is wasted.
"""
import csv
import json
import re
import sys

# The style half of the prompt. Identical on every single image — this is the
# only thing holding 1,000 separate generations together as one set. Changing a
# word of it partway through the library is how a set stops matching itself.
STYLE = (
    "Flat vector illustration, thick uniform outline, flat colour fills only, "
    "no gradients, no shading, no texture, simple geometric shapes, "
    "single centred subject, plain pale background, generous margins, "
    "minimal detail, absolutely no text, no letters, no words, no numbers, "
    "no signage."
)

# Scenes whose description implies readable text in the image.
TEXT_HINT = re.compile(
    r"\b(word|words|text|letter|letters|sign saying|written|writing|"
    r"note saying|label|dictionary page|form|headline)\b",
    re.I,
)


def main(source: str, dest: str) -> int:
    words = json.load(open(source, encoding="utf-8"))

    flagged = 0
    with open(dest, "w", newline="", encoding="utf-8") as fh:
        out = csv.writer(fh)
        out.writerow(["wordId", "word", "partOfSpeech", "needsReview", "prompt"])

        for w in words:
            scene = (w.get("visualAssociation") or "").strip()
            needs = "YES" if TEXT_HINT.search(scene) else ""
            if needs:
                flagged += 1
            out.writerow([
                w["wordId"],
                w["word"],
                w.get("partOfSpeech", ""),
                needs,
                f"{STYLE} Scene: {scene}",
            ])

    print(f"{len(words)} prompts written to {dest}")
    print(f"{flagged} flagged for review — rewrite their scene before generating")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    raise SystemExit(main(sys.argv[1], sys.argv[2]))
